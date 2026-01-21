<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary(); // WooCommerce ID
            $table->string('name');
            $table->string('slug');
            $table->string('permalink');
            $table->string('type')->default('simple');
            $table->string('status')->default('publish');
            $table->string('sku')->nullable()->index(); // Indexed for joining with product_prices
            $table->string('price')->nullable();
            $table->string('regular_price')->nullable();
            $table->string('sale_price')->nullable();
            $table->string('stock_status')->default('instock');
            $table->json('images')->nullable();
            $table->longText('description')->nullable(); // Using longText for HTML content
            $table->text('short_description')->nullable();
            $table->string('custom_description_url')->nullable();
            $table->unsignedBigInteger('parent_id')->default(0); // For variations
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
