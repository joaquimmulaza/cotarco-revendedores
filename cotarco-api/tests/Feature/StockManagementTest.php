<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\ProductPrice;
use App\Models\User;
use App\Models\PartnerProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class StockManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    /**
     * Helper to create a user and partner profile.
     */
    protected function createPartner()
    {
        $user = User::factory()->create([
            'role' => 'distribuidor',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        PartnerProfile::create([
            'user_id' => $user->id,
            'business_model' => 'B2B',
            'company_name' => 'Test Company',
            'phone_number' => '912345678',
            'alvara_path' => 'path/to/alvara.pdf',
        ]);

        return $user;
    }

    public function test_webhook_decrements_stock_on_success()
    {
        $sku = 'TEST-STOCK-001';
        $initialStock = 10;
        $purchaseQuantity = 2;

        // 1. Create Product and ProductPrice
        $product = Product::create([
            'id' => 1,
            'sku' => $sku,
            'name' => 'Test Product',
            'stock_status' => 'instock',
            'price' => 1000,
            'regular_price' => 1000,
            'status' => 'publish',
            'parent_id' => 0,
            'slug' => 'test-product',
            'permalink' => 'http://example.com/test-product',
        ]);

        $productPrice = ProductPrice::create([
            'product_sku' => $sku,
            'price_b2b' => 1000,
            'price_b2c' => 1500,
            'stock_quantity' => $initialStock,
        ]);

        // 2. Create Order
        $user = $this->createPartner();
        $merchantTransactionId = 'TR' . strtoupper(Str::random(13));

        $order = Order::create([
            'user_id' => $user->id,
            'merchant_transaction_id' => $merchantTransactionId,
            'total_amount' => 2000,
            'status' => 'pending',
            'shipping_details' => [],
        ]);

        $order->items()->create([
            'product_sku' => $sku,
            'name' => 'Test Product',
            'quantity' => $purchaseQuantity,
            'price' => 1000,
        ]);

        // 3. Simulate Webhook Success
        $payload = [
            'merchantTransactionId' => $merchantTransactionId,
            'responseStatus' => [
                'status' => 'Success',
            ],
            'reference' => [
                'entity' => '12345',
                'referenceNumber' => '123456789',
            ],
        ];

        $response = $this->postJson('/api/webhooks/appypay', $payload);

        $response->assertStatus(200);

        // 4. Assertions
        $productPrice->refresh();
        $this->assertEquals($initialStock - $purchaseQuantity, $productPrice->stock_quantity);
        
        $product->refresh();
        $this->assertEquals('instock', $product->stock_status); // Should still be instock
        $this->assertEquals('success', $order->fresh()->status);
    }

    public function test_webhook_sets_out_of_stock_when_quantity_reaches_zero()
    {
        $sku = 'TEST-STOCK-002';
        $initialStock = 2;
        $purchaseQuantity = 2;

        // 1. Create Product and ProductPrice
        $product = Product::create([
            'id' => 2,
            'sku' => $sku,
            'name' => 'Test Product',
            'stock_status' => 'instock',
            'price' => 1000,
            'regular_price' => 1000,
            'status' => 'publish',
            'parent_id' => 0,
            'slug' => 'test-product-2',
            'permalink' => 'http://example.com/test-product-2',
        ]);

        $productPrice = ProductPrice::create([
            'product_sku' => $sku,
            'price_b2b' => 1000,
            'price_b2c' => 1500,
            'stock_quantity' => $initialStock,
        ]);

        // 2. Create Order
        $user = $this->createPartner();
        $merchantTransactionId = 'TR' . strtoupper(Str::random(13));

        $order = Order::create([
            'user_id' => $user->id,
            'merchant_transaction_id' => $merchantTransactionId,
            'total_amount' => 2000,
            'status' => 'pending',
            'shipping_details' => [],
        ]);

        $order->items()->create([
            'product_sku' => $sku,
            'name' => 'Test Product',
            'quantity' => $purchaseQuantity,
            'price' => 1000,
        ]);

        // 3. Simulate Webhook Success
        $payload = [
            'merchantTransactionId' => $merchantTransactionId,
            'responseStatus' => [
                'status' => 'Success',
            ],
            'reference' => [
                'entity' => '12345',
                'referenceNumber' => '123456789',
            ],
        ];

        $response = $this->postJson('/api/webhooks/appypay', $payload);

        $response->assertStatus(200);

        // 4. Assertions
        $productPrice->refresh();
        $this->assertEquals(0, $productPrice->stock_quantity);
        
        $product->refresh();
        $this->assertEquals('outofstock', $product->stock_status); // Should be outofstock
    }
}
