<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductPrice extends Model
{
    protected $fillable = [
        'product_sku',
        'price_revendedor',
        'price_distribuidor',
    ];

    protected $casts = [
        'price_revendedor' => 'decimal:2',
        'price_distribuidor' => 'decimal:2',
    ];
}
