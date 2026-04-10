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
    protected $distributor1;
    protected $distributor2;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Criar administrador
        $this->admin = User::factory()->create([
            'role' => 'admin',
            'status' => 'active'
        ]);

        // Criar distribuidor 1
        $this->distributor1 = User::factory()->create([
            'role' => 'distribuidor',
            'status' => 'active'
        ]);

        // Criar perfil do distribuidor 1
        PartnerProfile::factory()->create([
            'user_id' => $this->distributor1->id,
            'company_name' => 'Empresa Distribuidora Teste 1',
            'phone_number' => '912345678',
            'business_model' => 'B2B'
        ]);

        // Criar distribuidor 2
        $this->distributor2 = User::factory()->create([
            'role' => 'distribuidor',
            'status' => 'active'
        ]);

        // Criar perfil do distribuidor 2
        PartnerProfile::factory()->create([
            'user_id' => $this->distributor2->id,
            'company_name' => 'Empresa Distribuidora Teste 2',
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
        $response = $this->getJson('/api/admin/partners?status=active');

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

        // Verificar se os distribuidores estão presentes
        $response->assertJsonFragment(['role' => 'distribuidor']);
    }

    /**
     * Teste para filtrar parceiros por role
     */
    #[Test]
    public function test_admin_can_filter_partners_by_role(): void
    {
        // Filtrar apenas distribuidores ativos
        $response = $this->getJson('/api/admin/partners?role=distribuidor&status=active');
        $response->assertStatus(200);
        
        $partners = $response->json('partners');
        foreach ($partners as $partner) {
            $this->assertEquals('distribuidor', $partner['role']);
        }
        $this->assertGreaterThanOrEqual(2, count($partners)); // Verifica que pelo menos 2 distribuidores foram retornados
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
        $response = $this->getJson('/api/admin/partners?search=Distribuidora&status=active');

        $response->assertStatus(200);
        $response->assertJsonFragment(['company_name' => 'Empresa Distribuidora Teste 1']);
        $response->assertJsonFragment(['company_name' => 'Empresa Distribuidora Teste 2']);
    }

    /**
     * Teste para verificar que apenas administradores podem acessar
     */
    #[Test]
    public function test_non_admin_users_cannot_access_partner_management(): void
    {
        // Tentar aceder como distribuidor
        Sanctum::actingAs($this->distributor1);
        
        $response = $this->getJson('/api/admin/partners');
        $response->assertStatus(403);

        $response = $this->putJson("/api/admin/partners/{$this->distributor2->id}", [
            'role' => 'distribuidor',
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

        $response = $this->putJson("/api/admin/partners/{$this->distributor1->id}", [
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
                'role' => 'distribuidor',
                'status' => 'active'
            ]);
            
            PartnerProfile::factory()->create([
                'user_id' => $user->id,
                'company_name' => "Empresa Teste {$i}",
                'business_model' => 'B2B'
            ]);
        }

        $response = $this->getJson('/api/admin/partners?per_page=10&page=1&status=active');

        $response->assertStatus(200);
        
        // Verificar se a paginação está funcionando
        $pagination = $response->json('pagination');
        $this->assertEquals(10, $pagination['per_page']);
        $this->assertEquals(1, $pagination['current_page']);
        $this->assertGreaterThanOrEqual(20, $pagination['total']);

        // Verificar se apenas 10 parceiros são retornados na primeira página
        $this->assertCount(10, $response->json('partners'));
    }

    /**
     * Teste para verificar que, por defeito, apenas parceiros pendentes são retornados
     */
    #[Test]
    public function test_default_status_is_pending_approval(): void
    {
        // Limpar parceiros criados no setUp que são ativos
        // Ou simplesmente criar um pendente e verificar se ele é o único na lista por defeito
        $pendingUser = User::factory()->create(['role' => 'revendedor', 'status' => 'pending_approval']);
        PartnerProfile::factory()->create(['user_id' => $pendingUser->id]);
        
        $response = $this->getJson('/api/admin/partners');
        $response->assertStatus(200);
        
        $partners = $response->json('partners');
        
        // Se a regra for aplicada, apenas parceiros pendentes devem aparecer
        foreach ($partners as $partner) {
            $this->assertEquals('pending_approval', $partner['status']);
        }
    }

    /**
     * Teste para filtrar parceiros com combinação de status e role
     */
    #[Test]
    public function test_admin_can_filter_by_combined_status_and_role(): void
    {
        // Criar revendedor ativo
        $revActive = User::factory()->create(['role' => 'revendedor', 'status' => 'active']);
        PartnerProfile::factory()->create(['user_id' => $revActive->id]);
        
        // Criar distribuidor ativo
        $distActive = User::factory()->create(['role' => 'distribuidor', 'status' => 'active']);
        PartnerProfile::factory()->create(['user_id' => $distActive->id]);
        
        // Criar revendedor pendente
        $revPending = User::factory()->create(['role' => 'revendedor', 'status' => 'pending_approval']);
        PartnerProfile::factory()->create(['user_id' => $revPending->id]);

        // Filtrar por revendedor E ativo
        $response = $this->getJson('/api/admin/partners?role=revendedor&status=active');
        $response->assertStatus(200);
        
        $partners = $response->json('partners');
        
        $ids = collect($partners)->pluck('id')->toArray();
        $this->assertContains($revActive->id, $ids);
        $this->assertNotContains($distActive->id, $ids);
        $this->assertNotContains($revPending->id, $ids);
    }
}
