<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RealDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sourceDb = 'cotarco_revendedores';
        $targetDb = config('database.connections.mysql.database');

        // Safety check to ensure we are not copying from/to the same database
        if ($sourceDb === $targetDb) {
            $this->command->warn('Source and target databases are the same. Skipping RealDataSeeder.');
            return;
        }

        $this->command->info("Syncing data from {$sourceDb} to {$targetDb}...");

        try {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            // 1. Sync Categories
            DB::table('categories')->truncate();
            DB::statement("INSERT INTO {$targetDb}.categories SELECT * FROM {$sourceDb}.categories");
            $this->command->info('Synced categories.');

            // 2. Sync Stock Files
            DB::table('stock_files')->truncate();
            DB::statement("INSERT INTO {$targetDb}.stock_files SELECT * FROM {$sourceDb}.stock_files");
            $this->command->info('Synced stock files.');

            // 3. Sync Users
            DB::table('users')->truncate();
            DB::statement("INSERT INTO {$targetDb}.users SELECT * FROM {$sourceDb}.users");
            $this->command->info('Synced users.');

            // 4. Sync Products
            DB::table('products')->truncate();
            DB::statement("INSERT INTO {$targetDb}.products SELECT * FROM {$sourceDb}.products");
            $this->command->info('Synced products.');

            // 5. Sync Category-Product relationships
            DB::table('category_product')->truncate();
            DB::statement("INSERT INTO {$targetDb}.category_product SELECT * FROM {$sourceDb}.category_product");
            $this->command->info('Synced product-category relationships.');

            // 6. Sync Product Prices
            DB::table('product_prices')->truncate();
            DB::statement("INSERT INTO {$targetDb}.product_prices SELECT * FROM {$sourceDb}.product_prices");
            $this->command->info('Synced product prices.');

            // 7. Sync Orders
            DB::table('orders')->truncate();
            DB::statement("INSERT INTO {$targetDb}.orders SELECT * FROM {$sourceDb}.orders");
            $this->command->info('Synced orders.');

            // 8. Sync Order Items
            DB::table('order_items')->truncate();
            DB::statement("INSERT INTO {$targetDb}.order_items SELECT * FROM {$sourceDb}.order_items");
            $this->command->info('Synced order items.');

            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            $this->command->info('Real data synchronization completed successfully!');
        } catch (\Exception $e) {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            $this->command->error('Error syncing real data: ' . $e->getMessage());
            Log::error('RealDataSeeder Error: ' . $e->getMessage());
        }
    }
}
