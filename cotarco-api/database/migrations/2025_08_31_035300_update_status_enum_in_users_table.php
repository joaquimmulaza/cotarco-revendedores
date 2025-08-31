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
        Schema::table('users', function (Blueprint $table) {
            // Lista completa de todos os status que o sistema pode ter
            $statusList = [
                'pending_email_validation',
                'pending_approval',
                'active',
                'rejected',
                'suspended', // Adicionado
                'inactive'   // Adicionado
            ];

            // Converte a lista para uma string formatada para o comando SQL
            $statusEnum = "'" . implode("','", $statusList) . "'";

            // Usa DB::statement para executar um comando ALTER TABLE que é compatível com MySQL
            // para modificar um ENUM.
            DB::statement("ALTER TABLE users MODIFY COLUMN status ENUM({$statusEnum}) NOT NULL DEFAULT 'pending_email_validation'");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
             // Lista antiga de status
            $statusList = [
                'pending_email_validation',
                'pending_approval',
                'active',
                'rejected'
            ];
            $statusEnum = "'" . implode("','", $statusList) . "'";
            DB::statement("ALTER TABLE users MODIFY COLUMN status ENUM({$statusEnum}) NOT NULL DEFAULT 'pending_email_validation'");
        });
    }
};
