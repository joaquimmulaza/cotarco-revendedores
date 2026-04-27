<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Teste de login bem-sucedido para um distribuidor aprovado
     */
    #[Test]
    public function test_an_approved_distributor_can_login_successfully(): void
    {
        // 1. Arrange: Cria um utilizador aprovado
        $user = User::factory()->create([
            'email' => 'aprovado@exemplo.com',
            'password' => bcrypt('password123'),
            'role' => 'distribuidor',
            'status' => 'active', // Status crucial
        ]);

        // 2. Act: Tenta fazer login
        $response = $this->postJson('/api/login', [
            'email' => 'aprovado@exemplo.com',
            'password' => 'password123',
        ]);

        // 3. Assert: Verifica se o login foi bem-sucedido e retornou um token
        $response->assertStatus(200)
                 ->assertJsonStructure(['token']);
    }

    /**
     * Teste de falha no login para um distribuidor pendente
     */
    #[Test]
    public function test_a_pending_distributor_cannot_login(): void
    {
        // 1. Arrange: Cria um utilizador pendente
        $user = User::factory()->create([
            'email' => 'pendente@exemplo.com',
            'password' => bcrypt('password123'),
            'status' => 'pending_approval', // Status crucial
        ]);

        // 2. Act: Tenta fazer login
        $response = $this->postJson('/api/login', [
            'email' => 'pendente@exemplo.com',
            'password' => 'password123',
        ]);

        // 3. Assert: Verifica se a API retornou um erro de acesso negado
        $response->assertStatus(403) // Forbidden
                 ->assertJson(['message' => 'Conta pendente de aprovação. Aguarde a aprovação do administrador.']);
    }

    /**
     * Teste de falha no login para um distribuidor reprovado
     */
    #[Test]
    public function test_a_rejected_distributor_cannot_login(): void
    {
        // 1. Arrange: Cria um utilizador reprovado
        $user = User::factory()->create([
            'email' => 'rejeitado@exemplo.com',
            'password' => bcrypt('password123'),
            'status' => 'rejected', // Status crucial
        ]);

        // 2. Act: Tenta fazer login
        $response = $this->postJson('/api/login', [
            'email' => 'rejeitado@exemplo.com',
            'password' => 'password123',
        ]);

        // 3. Assert: Verifica se a API retornou o mesmo erro
        $response->assertStatus(403)
                 ->assertJson(['message' => 'Conta rejeitada. Entre em contato com o suporte.']);
    }

    /**
     * Teste de acesso negado para utilizadores não-admin
     */
    #[Test]
    public function test_a_non_admin_user_cannot_access_admin_routes(): void
    {
        // 1. Arrange: Cria um distribuidor normal e autentica-o
        $distribuidor = User::factory()->create([
            'role' => 'distribuidor',
            'status' => 'active',
        ]);

        // 2. Act: Tenta aceder a uma rota de admin (ex: listar distribuidores pendentes)
        $response = $this->actingAs($distribuidor)->getJson('/api/admin/partners?status=pending_approval');

        // 3. Assert: Verifica se a API retornou um erro de "Forbidden"
        $response->assertStatus(403);
    }
}
