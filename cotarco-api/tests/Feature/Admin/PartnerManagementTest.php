<?php

namespace Tests\Feature\Admin;

use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\PartnerProfile;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PartnerManagementTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;
    protected $partner1;
    protected $partner2;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Criar administrador
        $this->admin = User::factory()->create([
            'role' => 'admin',
            'status' => 'active'
        ]);

        // Criar parceiro 1 (revendedor)
        $this->partner1 = User::factory()->create([
            'role' => 'revendedor',
            'status' => 'active'
        ]);

        // Criar perfil do parceiro 1
        PartnerProfile::factory()->create([
            'user_id' => $this->partner1->id,
            'company_name' => 'Empresa Parceira Teste 1',
            'phone_number' => '912345678',
            'business_model' => 'B2B'
        ]);

        // Criar parceiro 2 (distribuidor)
        $this->partner2 = User::factory()->create([
            'role' => 'distribuidor',
            'status' => 'active'
        ]);

        // Criar perfil do parceiro 2
        PartnerProfile::factory()->create([
            'user_id' => $this->partner2->id,
            'company_name' => 'Empresa Parceira Teste 2',
            'phone_number' => '912345679',
            'business_model' => 'B2C'
        ]);

        // Autenticar como administrador
        Sanctum::actingAs($this->admin);
    }

    /**
     * Teste para listar parceiros
     */
    #[Test]
    public function test_admin_can_list_partners(): void
    {
        $response = $this->getJson('/api/admin/partners');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'partners' => [
                         '*' => [
                             'id',
                             'name',
                             'email',
                             'role',
                             'status',
                             'partner_profile'
                         ]
                     ],
                     'pagination' => [
                         'current_page',
                         'last_page',
                         'per_page',
                         'total'
                     ]
                 ]);

        // Verificar se ambos os tipos de parceiros estão presentes
        $response->assertJsonFragment(['role' => 'revendedor']);
        $response->assertJsonFragment(['role' => 'distribuidor']);
    }

    /**
     * Teste para filtrar parceiros por role
     */
    #[Test]
    public function test_admin_can_filter_partners_by_role(): void
    {
        // Filtrar apenas revendedores
        $response = $this->getJson('/api/admin/partners?role=revendedor');
        $response->assertStatus(200);
        
        $partners = $response->json('partners');
        foreach ($partners as $partner) {
            $this->assertEquals('revendedor', $partner['role']);
        }
        $this->assertGreaterThanOrEqual(1, count($partners)); // Verifica que pelo menos 1 revendedor foi retornado
        
        // Filtrar apenas distribuidores
        $response = $this->getJson('/api/admin/partners?role=distribuidor');
        $response->assertStatus(200);
        
        $partners = $response->json('partners');
        foreach ($partners as $partner) {
            $this->assertEquals('distribuidor', $partner['role']);
        }
        $this->assertGreaterThanOrEqual(1, count($partners)); // Verifica que pelo menos 1 distribuidor foi retornado
    }

    /**
     * Teste para filtrar parceiros por status
     */
    #[Test]
    public function test_admin_can_filter_partners_by_status(): void
    {
        $response = $this->getJson('/api/admin/partners?status=active');

        $response->assertStatus(200);
        
        // Verificar se todos os parceiros retornados têm status 'active'
        $partners = $response->json('partners');
        foreach ($partners as $partner) {
            $this->assertEquals('active', $partner['status']);
        }
    }

    /**
     * Teste para buscar parceiros por texto
     */
    #[Test]
    public function test_admin_can_search_partners_by_text(): void
    {
        $response = $this->getJson('/api/admin/partners?search=Revendedora');

        $response->assertStatus(200);
        $response->assertJsonFragment(['company_name' => 'Empresa Revendedora Teste']);
        $response->assertJsonMissing(['company_name' => 'Empresa Distribuidora Teste']);
    }

    /**
     * Teste para verificar que apenas administradores podem acessar
     */
    #[Test]
    public function test_non_admin_users_cannot_access_partner_management(): void
    {
        // Tentar aceder como revendedor
        Sanctum::actingAs($this->revendedor);
        
        $response = $this->getJson('/api/admin/partners');
        $response->assertStatus(403);

        $response = $this->putJson("/api/admin/partners/{$this->distribuidor->id}", [
            'role' => 'revendedor',
            'business_model' => 'B2B'
        ]);
        $response->assertStatus(403);
    }

    /**
     * Teste para verificar que utilizadores não autenticados não podem acessar
     */
    #[Test]
    public function test_unauthenticated_users_cannot_access_partner_management(): void
    {
        // Fazer logout do admin usando Sanctum corretamente
        $this->app->get('auth')->forgetGuards();
        
        $response = $this->getJson('/api/admin/partners');
        $response->assertStatus(401);

        $response = $this->putJson("/api/admin/partners/{$this->revendedor->id}", [
            'role' => 'distribuidor',
            'business_model' => 'B2C'
        ]);
        $response->assertStatus(401);
    }

    /**
     * Teste para paginação dos parceiros
     */
    #[Test]
    public function test_admin_can_paginate_partners(): void
    {
        // Criar mais parceiros para testar paginação
        for ($i = 0; $i < 20; $i++) {
            $user = User::factory()->create([
                'role' => 'revendedor',
                'status' => 'active'
            ]);
            
            PartnerProfile::factory()->create([
                'user_id' => $user->id,
                'company_name' => "Empresa Teste {$i}",
                'business_model' => 'B2B'
            ]);
        }

        $response = $this->getJson('/api/admin/partners?per_page=10&page=1');

        $response->assertStatus(200);
        
        // Verificar se a paginação está funcionando (não importa o total exato)
        $pagination = $response->json('pagination');
        $this->assertEquals(10, $pagination['per_page']);
        $this->assertEquals(1, $pagination['current_page']);
        $this->assertGreaterThan(20, $pagination['total']); // Deve ter pelo menos os 20 novos + os originais

        // Verificar se apenas 10 parceiros são retornados na primeira página
        $this->assertCount(10, $response->json('partners'));
    }
}
