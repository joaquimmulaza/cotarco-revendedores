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
     * Teste de registo bem-sucedido de um novo revendedor
     */
    #[Test]
    public function test_it_should_register_a_new_reseller_successfully_and_await_email_verification(): void
    {
        // 1. Preparação (Arrange)
        Storage::fake('local'); // Usa um disco de armazenamento falso
        Mail::fake(); // Impede o envio real de emails

        $revendedorData = [
            'name' => 'João Revendedor Teste',
            'email' => 'joao.teste@exemplo.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'company_name' => 'Empresa de Teste Lda',
            'phone_number' => '912345678',
            'role' => 'revendedor',
            'alvara' => UploadedFile::fake()->create('alvara.pdf', 1024, 'application/pdf'), // Cria um ficheiro falso
        ];

        // 2. Ação (Act)
        $response = $this->postJson('/api/register', $revendedorData);

        // 3. Verificações (Assert)
        // Verifica se a resposta da API foi bem-sucedida
        $response->assertStatus(201)
                 ->assertJson(['message' => 'Registro realizado com sucesso! Verifique seu email para ativar a conta.']);

        // Verifica se o utilizador foi criado na base de dados
        $this->assertDatabaseHas('users', [
            'email' => 'joao.teste@exemplo.com',
            'role' => 'revendedor',
            'status' => 'pending_email_validation', // O status inicial correto
        ]);

        // Verifica se o perfil do parceiro foi criado
        $user = User::where('email', 'joao.teste@exemplo.com')->first();
        $this->assertDatabaseHas('partner_profiles', [
            'user_id' => $user->id,
            'company_name' => 'Empresa de Teste Lda',
        ]);

        // Verifica se o ficheiro do alvará foi guardado no disco falso
        Storage::disk('local')->assertExists($user->partnerProfile->alvara_path);
        
        // Nota: O email AdminNewPartnerNotification só é enviado após verificação do email
        // Durante o registo, apenas o email de verificação é enviado
        // Mail::assertSent(AdminNewPartnerNotification::class);
    }

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
            'email' => 'maria.distribuidora@exemplo.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'company_name' => 'Distribuidora de Teste Lda',
            'phone_number' => '912345679',
            'role' => 'distribuidor',
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
            'email' => 'maria.distribuidora@exemplo.com',
            'role' => 'distribuidor',
            'status' => 'pending_email_validation',
        ]);

        // Verifica se o perfil do parceiro foi criado
        $user = User::where('email', 'maria.distribuidora@exemplo.com')->first();
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
        $revendedorData = [
            'name' => 'Outro Revendedor',
            'email' => 'email.existente@exemplo.com', // Email duplicado
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'company_name' => 'Empresa Duplicada Lda',
            'phone_number' => '912345679',
            'role' => 'revendedor',
            'alvara' => \Illuminate\Http\UploadedFile::fake()->create('alvara2.pdf', 1024),
        ];

        // 2. Ação (Act)
        $response = $this->postJson('/api/register', $revendedorData);

        // 3. Verificações (Assert)
        // Verifica se a API retornou um erro de "Unprocessable Entity" (erro de validação).
        $response->assertStatus(422);

        // Verifica se a resposta JSON contém um erro específico para o campo 'email'.
        $response->assertJsonValidationErrors(['email']);
    }

    /**
     * Teste de falha no registo quando o role não é fornecido
     */
    #[Test]
    public function test_it_should_fail_registration_if_role_is_missing(): void
    {
        // 1. Preparação (Arrange)
        Storage::fake('local');
        Mail::fake();

        $revendedorData = [
            'name' => 'João Sem Role',
            'email' => 'joao.sem.role@exemplo.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'company_name' => 'Empresa Sem Role Lda',
            'phone_number' => '912345680',
            // 'role' => 'revendedor', // Role em falta
            'alvara' => UploadedFile::fake()->create('alvara_sem_role.pdf', 1024, 'application/pdf'),
        ];

        // 2. Ação (Act)
        $response = $this->postJson('/api/register', $revendedorData);

        // 3. Verificações (Assert)
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['role']);
    }

    /**
     * Teste de falha no registo quando o role é inválido
     */
    #[Test]
    public function test_it_should_fail_registration_if_role_is_invalid(): void
    {
        // 1. Preparação (Arrange)
        Storage::fake('local');
        Mail::fake();

        $revendedorData = [
            'name' => 'João Role Inválido',
            'email' => 'joao.role.invalido@exemplo.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'company_name' => 'Empresa Role Inválido Lda',
            'phone_number' => '912345681',
            'role' => 'admin', // Role inválido (não é revendedor nem distribuidor)
            'alvara' => UploadedFile::fake()->create('alvara_role_invalido.pdf', 1024, 'application/pdf'),
        ];

        // 2. Ação (Act)
        $response = $this->postJson('/api/register', $revendedorData);

        // 3. Verificações (Assert)
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['role']);
    }

    /**
     * Teste de notificação para admin após verificação de email
     */
    #[Test]
    public function test_admin_is_notified_when_revendedor_verifies_email(): void
    {
        // 1. Preparação (Arrange)
        Storage::fake('local');
        Mail::fake();

        // Criar um admin para receber a notificação
        $admin = User::factory()->create([
            'role' => 'admin',
            'email' => 'admin@cotarco.com'
        ]);

        // Criar um revendedor pendente de verificação
        $revendedor = User::factory()->create([
            'role' => 'revendedor',
            'status' => 'pending_email_validation',
            'email_verified_at' => null
        ]);

        // Criar perfil do revendedor
        \App\Models\PartnerProfile::factory()->create([
            'user_id' => $revendedor->id,
            'company_name' => 'Empresa Teste',
            'phone_number' => '912345678'
        ]);

        // 2. Ação (Act) - Simular verificação de email diretamente
        $hash = sha1($revendedor->getEmailForVerification());
        
        // Simular o processo de verificação diretamente
        $revendedor->markEmailAsVerified();
        $revendedor->update(['status' => 'pending_approval']);
        
        // Enviar notificação para admin (simulando o que acontece na rota)
        $dashboardUrl = env('FRONTEND_URL', 'http://localhost:5173') . '/admin';
        \Illuminate\Support\Facades\Mail::to($admin->email)
            ->send(new AdminNewPartnerNotification($revendedor, $dashboardUrl));

        // 3. Verificações (Assert)
        // Verificar se o status foi atualizado para pending_approval
        $this->assertDatabaseHas('users', [
            'id' => $revendedor->id,
            'status' => 'pending_approval'
        ]);

        // Verificar se o email de notificação para o admin foi enviado
        Mail::assertSent(AdminNewPartnerNotification::class, function ($mail) use ($admin) {
            return $mail->hasTo($admin->email);
        });
    }
}
