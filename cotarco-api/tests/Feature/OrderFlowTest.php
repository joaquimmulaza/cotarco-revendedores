<?php

namespace Tests\Feature;

use App\Jobs\CreateAppyPayChargeJob;
use App\Models\Order;
use App\Models\User;
use App\Models\PartnerProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class OrderFlowTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test creating a payment order (Finished buy).
     */
    public function test_create_payment_order(): void
    {
        Queue::fake();

        // Create a partner user
        $user = User::factory()->create([
            'role' => 'distribuidor',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        PartnerProfile::create([
            'user_id' => $user->id,
            'company_name' => 'Test Company',
            'phone_number' => '123456789',
            'business_model' => 'B2B',
            'discount_percentage' => 10,
            'alvara_path' => 'alvaras/test.pdf',
        ]);

        $this->actingAs($user, 'sanctum');

        $cartItems = [
            [
                'sku' => 'TEST-SKU-001',
                'name' => 'Test Product',
                'quantity' => 2,
                'price' => 1000,
                'image_url' => 'https://example.com/image.jpg',
            ],
        ];

        $shippingDetails = [
            'name' => 'John Doe',
            'address' => '123 Test St',
            'city' => 'Luanda',
            'phone' => '923456789',
        ];

        $response = $this->postJson('/api/orders/create-payment', [
            'items' => $cartItems,
            'details' => $shippingDetails,
        ]);

        $response->assertStatus(202)
            ->assertJsonStructure([
                'merchantTransactionId',
                'message',
            ]);

        // Assert order was created
        $this->assertDatabaseHas('orders', [
            'user_id' => $user->id,
            'total_amount' => 2000,
            'status' => 'pending',
        ]);

        // Assert job was dispatched
        Queue::assertPushed(CreateAppyPayChargeJob::class);
    }

    /**
     * Test retrieving payment reference.
     */
    public function test_get_payment_reference(): void
    {
        $user = User::factory()->create([
            'role' => 'distribuidor',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        PartnerProfile::create([
            'user_id' => $user->id,
            'company_name' => 'Test Company',
            'phone_number' => '123456789',
            'business_model' => 'B2B',
            'alvara_path' => 'alvaras/test.pdf',
        ]);

        $this->actingAs($user, 'sanctum');

        $order = Order::create([
            'user_id' => $user->id,
            'merchant_transaction_id' => 'TEST123',
            'total_amount' => 5000,
            'shipping_details' => [
                'payment_reference' => [
                    'entity' => '12345',
                    'referenceNumber' => '999888777',
                ],
            ],
            'status' => 'pending',
        ]);

        $response = $this->getJson('/api/orders/payment-reference/TEST123');

        $response->assertStatus(200)
            ->assertJson([
                'entity' => '12345',
                'reference' => '999888777',
                'amount' => 5000,
            ]);
    }

    /**
     * Test that unauthenticated users cannot create orders.
     */
    public function test_unauthenticated_user_cannot_create_order(): void
    {
        $response = $this->postJson('/api/orders/create-payment', [
            'items' => [],
            'details' => [],
        ]);

        $response->assertStatus(401);
    }
}
