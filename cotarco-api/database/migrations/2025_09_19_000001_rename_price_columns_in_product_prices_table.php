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
        Schema::table('product_prices', function (Blueprint $table) {
            $table->renameColumn('price_revendedor', 'price_b2c');
            $table->renameColumn('price_distribuidor', 'price_b2b');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_prices', function (Blueprint $table) {
            $table->renameColumn('price_b2c', 'price_revendedor');
            $table->renameColumn('price_b2b', 'price_distribuidor');
        });
    }
};


