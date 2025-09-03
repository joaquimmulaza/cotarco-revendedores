<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use App\Mail\PartnerApproved;
use App\Mail\PartnerRejected;
use Tests\TestCase;

class AdminActionsTest extends TestCase
{
    use RefreshDatabase;

    private $admin;

    // Prepara um utilizador admin para ser usado em todos os testes deste ficheiro
    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
    }

    /**
     * Teste de aprovação de um revendedor pendente
     */
    public function test_an_admin_can_approve_a_pending_reseller()
    {
        // 1. Arrange: Cria um revendedor pendente
        $revendedor = User::factory()->create([
            'role' => 'revendedor',
            'status' => 'pending_approval',
        ]);

        Mail::fake(); // Prepara o sistema de Mail falso

        // 2. Act: Atua como o admin e chama o endpoint de aprovação
        $response = $this->actingAs($this->admin)->putJson("/api/admin/partners/{$revendedor->id}/status", [
            'status' => 'active'
        ]);

        // 3. Assert
        $response->assertStatus(200)
                 ->assertJsonPath('partner.status', 'active');

        // Verifica se o status do utilizador na base de dados foi realmente atualizado
        $this->assertDatabaseHas('users', [
            'id' => $revendedor->id,
            'status' => 'active',
        ]);

        // Verifica se o email de aprovação foi enviado para o revendedor
        Mail::assertSent(PartnerApproved::class, function ($mail) use ($revendedor) {
            return $mail->hasTo($revendedor->email);
        });
    }

    /**
     * Teste de rejeição de um revendedor pendente
     */
    public function test_an_admin_can_reject_a_pending_reseller()
    {
        // 1. Arrange: Cria um revendedor pendente
        $revendedor = User::factory()->create([
            'role' => 'revendedor',
            'status' => 'pending_approval',
        ]);

        Mail::fake();

        // 2. Act: Atua como o admin e chama o endpoint de rejeição
        $response = $this->actingAs($this->admin)->putJson("/api/admin/partners/{$revendedor->id}/status", [
            'status' => 'rejected'
        ]);

        // 3. Assert
        $response->assertStatus(200)
                 ->assertJsonPath('partner.status', 'rejected');

        $this->assertDatabaseHas('users', [
            'id' => $revendedor->id,
            'status' => 'rejected',
        ]);

        // Verifica se o email de rejeição foi enviado
        Mail::assertSent(PartnerRejected::class, function ($mail) use ($revendedor) {
            return $mail->hasTo($revendedor->email);
        });
    }

    /**
     * Teste de validação de status inválido
     */
    public function test_an_admin_cannot_change_status_to_an_invalid_one()
    {
        // 1. Arrange
        $revendedor = User::factory()->create(['status' => 'pending_approval']);

        // 2. Act
        $response = $this->actingAs($this->admin)->putJson("/api/admin/partners/{$revendedor->id}/status", [
            'status' => 'invalid_status' // Um status que não existe
        ]);

        // 3. Assert: Verifica se a API retorna um erro de validação (422)
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['status']);
    }
}
