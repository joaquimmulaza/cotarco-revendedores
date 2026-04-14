<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

use App\Models\Product;
use Illuminate\Support\Facades\DB;

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$products = Product::where('name', 'like', '%lavar%')
    ->orWhere('name', 'like', '%frigorifico%')
    ->orWhere('name', 'like', '%fog_o%')
    ->get();

echo "Found " . $products->count() . " products related to appliances.\n";

foreach ($products as $product) {
    $categories = $product->categories()->pluck('name')->toArray();
    echo "ID: {$product->id}, SKU: {$product->sku}, Name: {$product->name}, Categories: [" . implode(', ', $categories) . "]\n";
}
