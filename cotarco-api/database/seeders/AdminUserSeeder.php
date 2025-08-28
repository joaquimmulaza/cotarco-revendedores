<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Verifica se já existe um usuário com este email
        if (!User::where('email', 'joaquimmulazadev@gmail.com')->exists()) {
            User::create([
                'name' => 'Márcio Charata',
                'email' => 'joaquimmulazadev@gmail.com',
                'password' => Hash::make('cotarco.2025'),
                'role' => 'admin',
                'status' => 'active',
                'email_verified_at' => now(),
            ]);

            $this->command->info('Administrador inicial criado com sucesso!');
        } else {
            $this->command->info('Administrador já existe na base de dados.');
        }
    }
}
