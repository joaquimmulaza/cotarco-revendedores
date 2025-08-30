<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\PartnerProfile;
use Illuminate\Support\Facades\Hash;

class TestRevendedorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Criar um revendedor de teste pendente de aprovação
        if (!User::where('email', 'teste@revendedor.com')->exists()) {
            $user = User::create([
                'name' => 'João Teste',
                'email' => 'teste@revendedor.com',
                'password' => Hash::make('password123'),
                'role' => 'revendedor',
                'status' => 'pending_approval',
                'email_verified_at' => now(),
            ]);

            PartnerProfile::create([
                'user_id' => $user->id,
                'company_name' => 'Empresa Teste Ltda',
                'phone_number' => '+351912345678',
                'alvara_path' => 'alvaras/teste_alvara.pdf',
                'business_model' => 'B2B',
            ]);

            $this->command->info('Revendedor de teste criado com sucesso!');
        } else {
            $this->command->info('Revendedor de teste já existe.');
        }
    }
}
