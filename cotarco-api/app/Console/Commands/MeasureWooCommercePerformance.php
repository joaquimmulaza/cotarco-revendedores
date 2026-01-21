<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\WooCommerceService;
use App\Models\ProductPrice;
use Illuminate\Support\Facades\Cache;

class MeasureWooCommercePerformance extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'benchmark:woocommerce';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Measure latency of WooCommerce API vs Local DB';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle(WooCommerceService $wooCommerceService)
    {
        $this->info('Starting Benchmark...');

        // 1. Measure WooCommerce API Call (bypass cache if possible, or clear it)
        // We will call the service directly. The service doesn't cache internally, the Controller does.
        // So calling the service directly measures the raw API speed.
        
        $this->info('Measuring WooCommerce API (External HTTP Request)...');
        $start = microtime(true);
        try {
            // Fetching 10 products
            $products = $wooCommerceService->getProducts(null, 1, 10);
            $end = microtime(true);
            $wcDuration = $end - $start;
            $count = count($products['products'] ?? []);
            $this->info("WooCommerce API: Fetched $count products in " . number_format($wcDuration, 4) . " seconds.");
        } catch (\Exception $e) {
            $this->error("WooCommerce API Error: " . $e->getMessage());
            $wcDuration = null;
        }

        // 2. Measure Local DB Query (Product Model)
        $this->info('Measuring Local DB Query (Product Model)...');
        $start = microtime(true);
        try {
            $products = \App\Models\Product::limit(10)->get();
            $end = microtime(true);
            $dbDuration = $end - $start;
            $count = $products->count();
            $this->info("Local DB: Fetched $count products in " . number_format($dbDuration, 4) . " seconds.");
        } catch (\Exception $e) {
             $this->error("Local DB Error: " . $e->getMessage());
             $dbDuration = null;
        }

        if ($wcDuration && $dbDuration) {
            $ratio = $wcDuration / $dbDuration;
            $this->info('');
            $this->info('--- Results ---');
            $this->info("WooCommerce API: " . number_format($wcDuration * 1000, 2) . " ms");
            $this->info("Local DB:      " . number_format($dbDuration * 1000, 2) . " ms");
            $this->info("Factor: Local DB is " . number_format($ratio, 1) . "x faster.");
        }

        return 0;
    }
}
