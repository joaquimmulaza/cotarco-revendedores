<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

use App\Models\Category;
use Illuminate\Support\Facades\DB;

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$categories = Category::all();
foreach ($categories as $category) {
    echo "ID: {$category->id}, Name: {$category->name}, Parent: {$category->parent}\n";
}
