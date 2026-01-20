<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\PartnerProfile;
use App\Models\ProductPrice;
use App\Models\StockFile;
use App\Services\WooCommerceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class ProductPricingCachingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        StockFile::unsetEventDispatcher();
        StockFile::query()->delete();
        Cache::flush();
    }

    protected function createPartner($email, $discountPercentage = 0)
    {
        $user = User::factory()->create([
            'email' => $email,
            'role' => 'distribuidor',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        PartnerProfile::create([
            'user_id' => $user->id,
            'company_name' => 'Test Company',
            'phone_number' => '923456789',
            'business_model' => 'B2B',
            'discount_percentage' => $discountPercentage,
            'alvara_path' => 'alvaras/test.pdf',
        ]);

        return $user;
    }

    public function test_pricing_updates_immediately_when_discount_changes()
    {
        // 1. Setup Data
        // Create an admin user for the stock file ownership
        $admin = User::factory()->create(['role' => 'admin']);

        StockFile::create([
            'display_name' => 'Stock B2B',
            'file_name' => 'stock_b2b.xlsx',
            'file_path' => 'stock/b2b.xlsx',
            'original_filename' => 'stock_b2b.xlsx',
            'mime_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'size' => 1024,
            'target_business_model' => 'B2B',
            'is_active' => true,
            'uploaded_by_user_id' => $admin->id,
        ]);

        ProductPrice::create([
            'product_sku' => 'CACHE-SKU-001',
            'price_b2b' => 100.00,
            'price_b2c' => 120.00,
            'stock_quantity' => 10,
        ]);

        // Mock WooCommerce to ensure we are hitting the controller logic
        $this->mock(WooCommerceService::class, function ($mock) {
            $mock->shouldReceive('getProducts')
                ->andReturn([
                    'products' => [
                        [
                            'id' => 1,
                            'name' => 'Cached Product',
                            'sku' => 'CACHE-SKU-001',
                            'regular_price' => '100',
                            'stock_status' => 'instock',
                            'images' => [],
                            'type' => 'simple',
                        ],
                    ],
                    'pagination' => [
                        'current_page' => 1,
                        'per_page' => 10,
                        'total_items' => 1,
                        'total_pages' => 1,
                    ],
                ]);
        });

        // 2. Create Partner with 10% discount
        $partner = $this->createPartner('partner@test.com', 10);

        // 3. First Request: Should have 10% discount (Price 90)
        $this->actingAs($partner, 'sanctum');
        $response1 = $this->getJson('/api/products');
        $response1->assertStatus(200);
        
        $product1 = $response1->json('data')[0];
        $this->assertEquals(90.00, $product1['price'], 'Initial price should be 90 (10% off 100)');
        $this->assertEquals(10, $product1['discount_percentage']);

        // 4. Update Partner Discount to 0% in Database
        $partner->partnerProfile()->update(['discount_percentage' => 0]);

        // 5. Second Request: Should immediately have 0% discount (Price 100)
        // This validates that the user-specific logic is NOT cached
        $response2 = $this->getJson('/api/products');
        $response2->assertStatus(200);

        $product2 = $response2->json('data')[0];
        $this->assertEquals(100.00, $product2['price'], 'Updated price should be 100 (0% off 100)');
        $this->assertEquals(0, $product2['discount_percentage']);
    }

    public function test_different_users_see_different_prices_with_same_cache()
    {
        // Create an admin user for the stock file ownership
        $admin = User::factory()->create(['role' => 'admin']);

        // Setup shared data
        StockFile::create([
            'display_name' => 'Stock B2B',
            'file_name' => 'stock_b2b.xlsx',
            'file_path' => 'stock/b2b.xlsx',
            'original_filename' => 'stock_b2b.xlsx',
            'mime_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'size' => 1024,
            'target_business_model' => 'B2B',
            'is_active' => true,
            'uploaded_by_user_id' => $admin->id,
        ]);

        ProductPrice::create([
            'product_sku' => 'MULTI-USER-SKU',
            'price_b2b' => 100.00,
            'stock_quantity' => 10,
        ]);

        $this->mock(WooCommerceService::class, function ($mock) {
            $mock->shouldReceive('getProducts')->withAnyArgs()->times(1) // Should only be called ONCE due to caching
                ->andReturn([
                    'products' => [
                        [
                            'id' => 1,
                            'name' => 'Multi User Product',
                            'sku' => 'MULTI-USER-SKU',
                            'regular_price' => '100',
                            'stock_status' => 'instock',
                            'type' => 'simple',
                        ],
                    ],
                    'pagination' => ['current_page' => 1, 'per_page' => 10, 'total_items' => 1, 'total_pages' => 1],
                ]);
        });

        // User A: 20% Discount
        $userA = $this->createPartner('userA@test.com', 20);
        
        // User B: 0% Discount
        $userB = $this->createPartner('userB@test.com', 0);

        // Request 1 (User A) - Triggers Cache Population
        $this->actingAs($userA, 'sanctum');
        $responseA = $this->getJson('/api/products');
        $responseA->assertStatus(200);
        $priceA = $responseA->json('data')[0]['price'];
        $this->assertEquals(80.00, $priceA);

        // Request 2 (User B) - Uses Cache for Products, but calculates own price
        $this->actingAs($userB, 'sanctum');
        $responseB = $this->getJson('/api/products');
        $responseB->assertStatus(200);
        $priceB = $responseB->json('data')[0]['price'];
        $this->assertEquals(100.00, $priceB);
    }
}
