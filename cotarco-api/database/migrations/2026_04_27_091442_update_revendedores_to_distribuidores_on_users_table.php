<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('users')->where('role', 'revendedor')->update(['role' => 'distribuidor']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reversão não é totalmente segura se houvessem distribuidores originais,
        // mas assumimos este update para testes/ambiente de dev se necessário.
        DB::table('users')->where('role', 'distribuidor')->update(['role' => 'revendedor']);
    }
};
