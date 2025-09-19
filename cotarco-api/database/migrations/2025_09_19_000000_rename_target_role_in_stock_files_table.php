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
        Schema::table('stock_files', function (Blueprint $table) {
            $table->renameColumn('target_role', 'target_business_model');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_files', function (Blueprint $table) {
            $table->renameColumn('target_business_model', 'target_role');
        });
    }
};


