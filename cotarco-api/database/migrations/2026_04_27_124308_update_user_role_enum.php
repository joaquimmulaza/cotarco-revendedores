<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First ensure any remaining 'revendedor' is changed to 'distribuidor'
        DB::table('users')->where('role', 'revendedor')->update(['role' => 'distribuidor']);
        
        // Then alter the column if using MySQL
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'distribuidor') NULL DEFAULT 'distribuidor'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'revendedor', 'distribuidor') NULL DEFAULT 'distribuidor'");
        }
    }
};
