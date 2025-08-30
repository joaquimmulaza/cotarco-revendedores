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
        // Renomear a tabela de revendedor_profiles para partner_profiles
        Schema::rename('revendedor_profiles', 'partner_profiles');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverter: renomear de volta para revendedor_profiles
        Schema::rename('partner_profiles', 'revendedor_profiles');
    }
};
