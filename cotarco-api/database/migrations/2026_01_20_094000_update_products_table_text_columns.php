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
        Schema::table('products', function (Blueprint $table) {
            // Change description and short_description to longText to handle large HTML content
            $table->longText('description')->nullable()->change();
            $table->longText('short_description')->nullable()->change();
            
            // Change name to text just in case (though 255 is usually enough, some titles are huge)
            $table->text('name')->change();
            
            // Ensure sku is indexed (it was in create, but good to double check or add if missing)
            // $table->index('sku'); // Already done in create
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->text('description')->nullable()->change();
            $table->text('short_description')->nullable()->change();
            $table->string('name')->change();
        });
    }
};
