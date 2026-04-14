<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

use App\Models\Category;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$categoryId = 117; // Eletrodomésticos
$category = Category::find($categoryId);

if (!$category) {
    echo "Category 117 not found!\n";
    exit;
}

echo "Category: {$category->name} (ID: {$category->id})\n";

$productsCount = $category->products()->count();
echo "Products count: {$productsCount}\n";

$products = $category->products()->where('status', 'publish')->where('parent_id', 0)->take(5)->get();
foreach ($products as $product) {
    echo "ID: {$product->id}, SKU: {$product->sku}, Name: {$product->name}, Status: {$product->status}, Parent: {$product->parent_id}\n";
}
