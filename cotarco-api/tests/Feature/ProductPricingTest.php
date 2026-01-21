<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\PartnerProfile;
use App\Models\ProductPrice;
use App\Models\StockFile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class ProductPricingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Disable observer to prevent cache:clear from interfering with transactions
        StockFile::unsetEventDispatcher();
        // Explicitly clean up stock files to prevent leakage
        StockFile::query()->delete();
    }

    protected function createPartner($businessModel = 'B2B', $discountPercentage = 0)
    {
        $user = User::factory()->create([
            'role' => 'distribuidor',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        PartnerProfile::create([
            'user_id' => $user->id,
            'company_name' => 'Test Company',
            'phone_number' => '923456789',
            'business_model' => $businessModel,
            'discount_percentage' => $discountPercentage,
            'alvara_path' => 'alvaras/test.pdf',
        ]);

        return $user;
    }

    /**
     * Test product pricing with B2B business model.
     */
    public function test_product_pricing_b2b(): void
    {
        Cache::flush();

        $partner = $this->createPartner('B2B', 0);

        // Create active stock file for B2B
        StockFile::create([
            'display_name' => 'Stock B2B',
            'file_name' => 'stock_b2b.xlsx',
            'file_path' => 'stock/b2b.xlsx',
            'original_filename' => 'stock_b2b.xlsx',
            'mime_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'size' => 1024,
            'target_business_model' => 'B2B',
            'is_active' => true,
            'uploaded_by_user_id' => 1,
        ]);

        // Create product price
        ProductPrice::create([
            'product_sku' => 'TEST-SKU-001',
            'price_b2b' => 1000.00,
            'price_b2c' => 1200.00,
            'stock_quantity' => 10,
        ]);

        // Create local product
        \App\Models\Product::create([
            'id' => 1,
            'name' => 'Test Product',
            'sku' => 'TEST-SKU-001',
            'regular_price' => '1500',
            'stock_status' => 'instock',
            'images' => [],
            'type' => 'simple',
            'status' => 'publish',
            'parent_id' => 0,
            'price' => '1500', // Needed as default
            'slug' => 'test-product',
            'permalink' => 'http://example.com/product',
        ]);

        $this->actingAs($partner, 'sanctum');

        $response = $this->getJson('/api/products');

        $response->assertStatus(200);

        $products = $response->json('data');
        $this->assertNotEmpty($products);

        // Check that B2B price is applied
        $product = $products[0];
        $this->assertEquals(1000.00, $product['price']);
        $this->assertEquals(0, $product['discount_percentage']);
    }

    /**
     * Test product pricing with partner discount.
     */
    public function test_product_pricing_with_discount(): void
    {
        Cache::flush();

        $partner = $this->createPartner('B2B', 10); // 10% discount

        // Create active stock file for B2B
        StockFile::create([
            'display_name' => 'Stock B2B Discount',
            'file_name' => 'stock_b2b.xlsx',
            'file_path' => 'stock/b2b.xlsx',
            'original_filename' => 'stock_b2b.xlsx',
            'mime_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'size' => 1024,
            'target_business_model' => 'B2B',
            'is_active' => true,
            'uploaded_by_user_id' => 1,
        ]);

        // Create product price
        ProductPrice::create([
            'product_sku' => 'TEST-SKU-002',
            'price_b2b' => 1000.00,
            'price_b2c' => 1200.00,
            'stock_quantity' => 10,
        ]);

        // Create local product
        \App\Models\Product::create([
            'id' => 2,
            'name' => 'Test Product 2',
            'sku' => 'TEST-SKU-002',
            'regular_price' => '1500',
            'stock_status' => 'instock',
            'images' => [],
            'type' => 'simple',
            'status' => 'publish',
            'parent_id' => 0,
            'price' => '1500',
            'slug' => 'test-product-2',
            'permalink' => 'http://example.com/product-2',
        ]);

        $this->actingAs($partner, 'sanctum');

        $response = $this->getJson('/api/products');

        $response->assertStatus(200);

        $products = $response->json('data');
        $this->assertNotEmpty($products);

        // Check that discount is applied (1000 - 10% = 900)
        $product = $products[0];
        $this->assertEquals(900.00, $product['price']);
        $this->assertEquals(1000.00, $product['original_price']);
        $this->assertEquals(10, $product['discount_percentage']);
    }

    /**
     * Test product pricing without active stock file.
     */
    public function test_product_pricing_without_stock_file(): void
    {
        Cache::flush();

        $partner = $this->createPartner('B2B', 10);

        // No active stock file created

        // Create product price (should not be used)
        ProductPrice::create([
            'product_sku' => 'TEST-SKU-003',
            'price_b2b' => 1000.00,
            'price_b2c' => 1200.00,
            'stock_quantity' => 10,
        ]);

        // Create local product
        \App\Models\Product::create([
            'id' => 3,
            'name' => 'Test Product 3',
            'sku' => 'TEST-SKU-003',
            'regular_price' => '1500',
            'stock_status' => 'instock',
            'images' => [],
            'type' => 'simple',
            'status' => 'publish',
            'parent_id' => 0,
            'price' => '1500',
            'slug' => 'test-product-3',
            'permalink' => 'http://example.com/product-3',
        ]);

        $this->actingAs($partner, 'sanctum');

        $response = $this->getJson('/api/products');

        $response->assertStatus(200);

        $products = $response->json('data');
        $this->assertNotEmpty($products);

        // Check that no local price is applied
        $product = $products[0];
        $this->assertNull($product['price']);
    }

    /**
     * Test B2C pricing.
     */
    public function test_product_pricing_b2c(): void
    {
        Cache::flush();

        $partner = $this->createPartner('B2C', 5);

        // Create active stock file for B2C
        StockFile::create([
            'display_name' => 'Stock B2C',
            'file_name' => 'stock_b2c.xlsx',
            'file_path' => 'stock/b2c.xlsx',
            'original_filename' => 'stock_b2c.xlsx',
            'mime_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'size' => 1024,
            'target_business_model' => 'B2C',
            'is_active' => true,
            'uploaded_by_user_id' => 1,
        ]);

        // Create product price
        ProductPrice::create([
            'product_sku' => 'TEST-SKU-004',
            'price_b2b' => 1000.00,
            'price_b2c' => 1200.00,
            'stock_quantity' => 10,
        ]);

        // Create local product
        \App\Models\Product::create([
            'id' => 4,
            'name' => 'Test Product 4',
            'sku' => 'TEST-SKU-004',
            'regular_price' => '1500',
            'stock_status' => 'instock',
            'images' => [],
            'type' => 'simple',
            'status' => 'publish',
            'parent_id' => 0,
            'price' => '1500',
            'slug' => 'test-product-4',
            'permalink' => 'http://example.com/product-4',
        ]);

        $this->actingAs($partner, 'sanctum');

        $response = $this->getJson('/api/products');

        $response->assertStatus(200);

        $products = $response->json('data');
        $this->assertNotEmpty($products);

        // Check that B2C price is applied with discount (1200 - 5% = 1140)
        $product = $products[0];
        $this->assertEquals(1140.00, $product['price']);
        $this->assertEquals(1200.00, $product['original_price']);
        $this->assertEquals(5, $product['discount_percentage']);
    }
}
