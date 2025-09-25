<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductPrice extends Model
{
    protected $fillable = [
        'product_sku',
        'price_b2c',
        'price_b2b',
        'stock_quantity',
    ];

    protected $casts = [
        'price_b2c' => 'decimal:2',
        'price_b2b' => 'decimal:2',
    ];
}
