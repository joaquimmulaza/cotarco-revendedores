<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'id',
        'name',
        'slug',
        'permalink',
        'type',
        'status',
        'sku',
        'price',
        'regular_price',
        'sale_price',
        'stock_status',
        'images',
        'description',
        'short_description',
        'custom_description_url',
        'attributes',
        'parent_id'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'images' => 'array',
        'attributes' => 'array',
        'id' => 'integer',
        'parent_id' => 'integer',
        // 'price', 'regular_price', 'sale_price' kept as strings to match WC behavior (money strings)
    ];

    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = false;

    /**
     * Relationship with ProductPrice (Local B2B/B2C prices).
     * Joined by SKU.
     */
    public function prices()
    {
        return $this->hasOne(ProductPrice::class, 'product_sku', 'sku');
    }
    
    /**
     * Variations (if this is a parent product)
     */
    public function variations()
    {
        return $this->hasMany(Product::class, 'parent_id');
    }

    /**
     * Parent (if this is a variation)
     */
    public function parent()
    {
        return $this->belongsTo(Product::class, 'parent_id');
    }

    public function categories()
    {
        return $this->belongsToMany(Category::class, 'category_product', 'product_id', 'category_id');
    }
}
