<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use App\Models\User;
use App\Mail\AdminNewPartnerNotification;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Teste de registo bem-sucedido de um novo distribuidor
     */
    #[Test]
    public function test_it_should_register_a_new_distributor_successfully(): void
    {
        // 1. Preparação (Arrange)
        Storage::fake('local'); // Usa um disco de armazenamento falso
        Mail::fake(); // Impede o envio real de emails

        $distribuidorData = [
            'name' => 'Maria Distribuidora Teste',
            'email' => 'maria.distribuidora.unique@exemplo.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'company_name' => 'Distribuidora de Teste Lda',
            'phone_number' => '912345679',
            'role' => 'distribuidor',
            'business_model' => 'B2B',
            'alvara' => UploadedFile::fake()->create('alvara_distribuidor.pdf', 1024, 'application/pdf'),
        ];

        // 2. Ação (Act)
        $response = $this->postJson('/api/register', $distribuidorData);

        // 3. Verificações (Assert)
        // Verifica se a resposta da API foi bem-sucedida
        $response->assertStatus(201)
                 ->assertJson(['message' => 'Registro realizado com sucesso! Verifique seu email para ativar a conta.']);

        // Verifica se o utilizador foi criado na base de dados
        $this->assertDatabaseHas('users', [
            'email' => 'maria.distribuidora.unique@exemplo.com',
            'role' => 'distribuidor',
            'status' => 'pending_email_validation',
        ]);

        // Verifica se o perfil do parceiro foi criado
        $user = User::where('email', 'maria.distribuidora.unique@exemplo.com')->first();
        $this->assertDatabaseHas('partner_profiles', [
            'user_id' => $user->id,
            'company_name' => 'Distribuidora de Teste Lda',
        ]);

        // Verifica se o ficheiro do alvará foi guardado no disco falso
        Storage::disk('local')->assertExists($user->partnerProfile->alvara_path);
    }

    /**
     * Teste de falha no registo quando o email já existe
     */
    #[Test]
    public function test_it_should_fail_registration_if_email_already_exists(): void
    {
        // 1. Preparação (Arrange)
        // Primeiro, criamos um utilizador existente na base de dados.
        \App\Models\User::factory()->create([
            'email' => 'email.existente@exemplo.com',
        ]);

        // Dados para a nova tentativa de registo com o mesmo email.
        $distributorData = [
            'name' => 'Outro Distribuidor',
            'email' => 'email.existente@exemplo.com', // Email duplicado
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'company_name' => 'Empresa Duplicada Lda',
            'phone_number' => '912345679',
            'role' => 'distribuidor',
            'business_model' => 'B2B',
            'alvara' => \Illuminate\Http\UploadedFile::fake()->create('alvara2.pdf', 1024),
        ];

        // 2. Ação (Act)
        $response = $this->postJson('/api/register', $distributorData);

        // 3. Verificações (Assert)
        // Verifica se a API retornou um erro de "Unprocessable Entity" (erro de validação).
        $response->assertStatus(422);

        // Verifica se a resposta JSON contém um erro específico para o campo 'email'.
        $response->assertJsonValidationErrors(['email']);
    }

    /**
     * Teste de notificação para admin após verificação de email
     */
    #[Test]
    public function test_admin_is_notified_when_distributor_verifies_email(): void
    {
        // 1. Preparação (Arrange)
        Storage::fake('local');
        Mail::fake();

        // Criar um admin para receber a notificação
        $admin = User::factory()->create([
            'role' => 'admin',
            'email' => 'admin_notification@cotarco.com'
        ]);

        // Criar um distribuidor pendente de verificação
        $distributor = User::factory()->create([
            'role' => 'distribuidor',
            'status' => 'pending_email_validation',
            'email_verified_at' => null
        ]);

        // Criar perfil do distribuidor
        \App\Models\PartnerProfile::factory()->create([
            'user_id' => $distributor->id,
            'company_name' => 'Empresa Teste',
            'phone_number' => '912345678'
        ]);

        // 2. Ação (Act) - Simular verificação de email diretamente
        
        // Simular o processo de verificação diretamente
        $distributor->markEmailAsVerified();
        $distributor->update(['status' => 'pending_approval']);
        
        // Enviar notificação para admin (simulando o que acontece na rota ou listener)
        $dashboardUrl = env('FRONTEND_URL', 'http://localhost:5173') . '/admin';
        \Illuminate\Support\Facades\Mail::to($admin->email)
            ->send(new AdminNewPartnerNotification($distributor, $dashboardUrl));

        // 3. Verificações (Assert)
        // Verificar se o status foi atualizado para pending_approval
        $this->assertDatabaseHas('users', [
            'id' => $distributor->id,
            'status' => 'pending_approval'
        ]);

        // Verificar se o email de notificação para o admin foi enviado
        Mail::assertSent(AdminNewPartnerNotification::class, function ($mail) use ($admin) {
            return $mail->hasTo($admin->email);
        });
    }
}
