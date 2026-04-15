<?php
// CREDENCIAIS DE TESTE (CONFORME SOLICITADO PELO UTILIZADOR):
// Email: joaquimmulazadev@gmail.com
// Senha: cotarco.2025

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\PartnerProfile;
use Illuminate\Support\Facades\Hash;

class PlaywrightAuthSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Garantir que o Administrador existe (conforme admin.auth.setup.js)
        User::updateOrCreate(
            ['email' => 'joaquimmulazadev@gmail.com'],
            [
                'name' => 'Admin Playwright',
                'password' => Hash::make('cotarco.2025'),
                'role' => 'admin',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );
        $this->command->info('Admin para Playwright garantido (joaquimmulazadev@gmail.com).');

        // 2. Garantir que o Parceiro existe (conforme auth.setup.js)
        $user = User::updateOrCreate(
            ['email' => 'marketing@soclima.com'],
            [
                'name' => 'Parceiro Playwright',
                'password' => Hash::make('cotarco.2025'),
                'role' => 'revendedor',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        PartnerProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'company_name' => 'Soclima Teste Playwright',
                'phone_number' => '+351210000000',
                'alvara_path' => 'alvaras/playwright.pdf',
                'business_model' => 'B2B',
                'discount_percentage' => 10.00,
            ]
        );
        $this->command->info('Parceiro para Playwright garantido (marketing@soclima.com).');

        // 3. Garantir que existem categorias e produtos para os testes de Dashboard
        $category = \App\Models\Category::updateOrCreate(
            ['id' => 999999], // ID alto para evitar colisões
            [
                'name' => 'Teste Playwright',
                'slug' => 'teste-playwright',
                'parent' => 0,
                'count' => 1
            ]
        );

        $product = \App\Models\Product::updateOrCreate(
            ['sku' => 'PW-TEST-001'],
            [
                'id' => 999999,
                'name' => 'Produto de Teste Playwright',
                'slug' => 'produto-teste-playwright',
                'permalink' => '/produto-teste-playwright',
                'status' => 'publish',
                'price' => 1000.00,
                'stock_status' => 'instock',
                'description' => 'Produto gerado para testes automatizados'
            ]
        );

        $product->categories()->syncWithoutDetaching([$category->id]);

        \App\Models\ProductPrice::updateOrCreate(
            ['product_sku' => 'PW-TEST-001'],
            [
                'price_b2b' => 900.00,
                'stock_quantity' => 50
            ]
        );
        
        $this->command->info('Produtos e categorias de teste garantidos.');
    }
}
