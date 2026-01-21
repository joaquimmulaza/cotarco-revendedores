<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\WooCommerceService;

class SyncWooCommerce extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sync:woocommerce';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync products and categories from WooCommerce to local database';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle(WooCommerceService $wooCommerceService)
    {
        $this->info('Starting WooCommerce Sync...');

        try {
            // 1. Sync Categories
            $this->info('Syncing Categories...');
            $catCount = $wooCommerceService->syncCategories();
            $this->info("Categories Synced: $catCount");

            // 2. Sync Products
            $this->info('Syncing Products...');
            $prodCount = $wooCommerceService->syncProducts();
            $this->info("Products Synced: $prodCount");
            
            $this->info('Sync Completed Successfully.');
            return 0;
        } catch (\Exception $e) {
            $this->error('Sync Failed: ' . $e->getMessage());
            $this->error($e->getTraceAsString());
            return 1;
        }
    }
}
