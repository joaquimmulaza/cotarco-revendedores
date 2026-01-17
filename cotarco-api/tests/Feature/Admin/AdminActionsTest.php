<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use App\Mail\PartnerApproved;
use App\Mail\PartnerRejected;
use PHPUnit\Framework\Attributes\Test;
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
     * Teste de aprovação de um distribuidor pendente
     */
    #[Test]
    public function test_an_admin_can_approve_a_pending_distributor(): void
    {
        // 1. Arrange: Cria um distribuidor pendente
        $distribuidor = User::factory()->create([
            'role' => 'distribuidor',
            'status' => 'pending_approval',
        ]);

        Mail::fake(); // Prepara o sistema de Mail falso

        // 2. Act: Atua como o admin e chama o endpoint de aprovação
        $response = $this->actingAs($this->admin)->putJson("/api/admin/partners/{$distribuidor->id}/status", [
            'status' => 'active'
        ]);

        // 3. Assert
        $response->assertStatus(200)
                 ->assertJsonPath('partner.status', 'active');

        // Verifica se o status do utilizador na base de dados foi realmente atualizado
        $this->assertDatabaseHas('users', [
            'id' => $distribuidor->id,
            'status' => 'active',
        ]);

        // Verifica se o email de aprovação foi enviado para o distribuidor
        Mail::assertSent(PartnerApproved::class, function ($mail) use ($distribuidor) {
            return $mail->hasTo($distribuidor->email);
        });
    }

    /**
     * Teste de rejeição de um distribuidor pendente
     */
    #[Test]
    public function test_an_admin_can_reject_a_pending_distributor(): void
    {
        // 1. Arrange: Cria um distribuidor pendente
        $distribuidor = User::factory()->create([
            'role' => 'distribuidor',
            'status' => 'pending_approval',
        ]);

        Mail::fake();

        // 2. Act: Atua como o admin e chama o endpoint de rejeição
        $response = $this->actingAs($this->admin)->putJson("/api/admin/partners/{$distribuidor->id}/status", [
            'status' => 'rejected'
        ]);

        // 3. Assert
        $response->assertStatus(200)
                 ->assertJsonPath('partner.status', 'rejected');

        $this->assertDatabaseHas('users', [
            'id' => $distribuidor->id,
            'status' => 'rejected',
        ]);

        // Verifica se o email de rejeição foi enviado
        Mail::assertSent(PartnerRejected::class, function ($mail) use ($distribuidor) {
            return $mail->hasTo($distribuidor->email);
        });
    }

    /**
     * Teste de validação de status inválido
     */
    #[Test]
    public function test_an_admin_cannot_change_status_to_an_invalid_one(): void
    {
        // 1. Arrange
        $distribuidor = User::factory()->create(['role' => 'distribuidor', 'status' => 'pending_approval']);

        // 2. Act
        $response = $this->actingAs($this->admin)->putJson("/api/admin/partners/{$distribuidor->id}/status", [
            'status' => 'invalid_status' // Um status que não existe
        ]);

        // 3. Assert: Verifica se a API retorna um erro de validação (422)
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['status']);
    }

    #[Test]
    public function an_admin_can_deactivate_an_active_partner_and_an_email_is_sent(): void
    {
        $partner = User::factory()->create(['role' => 'distribuidor', 'status' => 'active']);
        Mail::fake();

        $this->actingAs($this->admin)->putJson("/api/admin/partners/{$partner->id}/status", [
            'status' => 'inactive'
        ]);

        $this->assertDatabaseHas('users', ['id' => $partner->id, 'status' => 'inactive']);
        Mail::assertSent(\App\Mail\PartnerDeactivated::class, function ($mail) use ($partner) {
            return $mail->hasTo($partner->email);
        });
    }

    #[Test]
    public function an_admin_can_reactivate_an_inactive_partner_and_a_reactivation_email_is_sent(): void
    {
        $partner = User::factory()->create(['role' => 'distribuidor', 'status' => 'inactive']);
        Mail::fake();

        $this->actingAs($this->admin)->putJson("/api/admin/partners/{$partner->id}/status", [
            'status' => 'active'
        ]);

        $this->assertDatabaseHas('users', ['id' => $partner->id, 'status' => 'active']);
        
        // Verifica que o email de REATIVAÇÃO foi enviado
        Mail::assertSent(\App\Mail\PartnerReactivated::class, function ($mail) use ($partner) {
            return $mail->hasTo($partner->email);
        });

        // E garante que o email de APROVAÇÃO (o antigo) NÃO foi enviado
        Mail::assertNotSent(\App\Mail\PartnerApproved::class);
    }

    #[Test]
    public function test_an_admin_can_update_partner_discount(): void
    {
        $partner = User::factory()->create(['role' => 'distribuidor', 'status' => 'active']);
        \App\Models\PartnerProfile::create([
            'user_id' => $partner->id,
            'company_name' => 'Test',
            'business_model' => 'B2B',
            'phone_number' => '123456789',
            'alvara_path' => 'alvaras/test.pdf'
        ]);

        $this->actingAs($this->admin)->putJson("/api/admin/partners/{$partner->id}", [
            'discount_percentage' => 15,
        ])->assertStatus(200);

        $this->assertDatabaseHas('partner_profiles', [
            'user_id' => $partner->id,
            'discount_percentage' => 15,
        ]);
    }

    #[Test]
    public function test_an_admin_can_download_partner_alvara(): void
    {
        \Illuminate\Support\Facades\Storage::fake('local');
        $partner = User::factory()->create(['role' => 'distribuidor', 'status' => 'active']);
        
        $file = \Illuminate\Http\UploadedFile::fake()->create('alvara.pdf', 100);
        $path = $file->store('alvaras');

        \App\Models\PartnerProfile::create([
            'user_id' => $partner->id,
            'company_name' => 'Test',
            'business_model' => 'B2B',
            'alvara_path' => $path,
            'phone_number' => '123456789'
        ]);

        $this->actingAs($this->admin)
            ->getJson("/api/admin/partners/{$partner->id}/alvara")
            ->assertStatus(200)
            ->assertHeader('Content-Type', 'application/pdf');
    }
}
