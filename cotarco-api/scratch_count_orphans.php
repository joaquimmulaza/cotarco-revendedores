<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

use App\Models\Product;
use Illuminate\Support\Facades\DB;

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$totalProducts = Product::count();
$productsWithCategories = DB::table('category_product')->distinct('product_id')->count();
$productsWithoutCategories = $totalProducts - $productsWithCategories;

echo "Total products: {$totalProducts}\n";
echo "Products with categories: {$productsWithCategories}\n";
echo "Products without categories: {$productsWithoutCategories}\n";

// List some products without categories
$orphans = Product::whereNotExists(function ($query) {
    $query->select(DB::raw(1))
          ->from('category_product')
          ->whereColumn('category_product.product_id', 'products.id');
})->take(10)->get();

foreach ($orphans as $orphan) {
    echo "Orphan: ID: {$orphan->id}, Name: {$orphan->name}\n";
}
