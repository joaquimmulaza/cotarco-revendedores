<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use App\Models\User;
use App\Mail\AdminNewRevendedorNotification;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Teste de registo bem-sucedido de um novo revendedor
     */
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

        // Verifica se o perfil do revendedor foi criado
        $user = User::where('email', 'joao.teste@exemplo.com')->first();
        $this->assertDatabaseHas('revendedor_profiles', [
            'user_id' => $user->id,
            'company_name' => 'Empresa de Teste Lda',
        ]);

        // Verifica se o ficheiro do alvará foi guardado no disco falso
        Storage::disk('local')->assertExists($user->revendedorProfile->alvara_path);
        
        // Nota: O email AdminNewRevendedorNotification só é enviado após verificação do email
        // Durante o registo, apenas o email de verificação é enviado
        // Mail::assertSent(AdminNewRevendedorNotification::class);
    }

    /**
     * Teste de falha no registo quando o email já existe
     */
    public function test_it_should_fail_registration_if_email_already_exists()
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
}
