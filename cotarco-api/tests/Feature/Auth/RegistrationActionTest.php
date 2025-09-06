<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Event;
use App\Models\User;
use App\Models\PartnerProfile;
use App\Mail\AdminNewPartnerNotification;
use Illuminate\Auth\Events\Registered;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class RegistrationActionTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Teste de registo bem-sucedido de um novo parceiro
     */
    #[Test]
    public function test_a_new_partner_can_be_registered_successfully(): void
    {
        // 1. Preparação (Arrange)
        Storage::fake('private'); // Simular o armazenamento de ficheiros
        Mail::fake(); // Simular o envio de emails
        Event::fake(); // Simular eventos

        // Criar um admin para receber notificações (se necessário)
        $admin = User::factory()->create([
            'role' => 'admin',
            'email' => 'admin@cotarco.com'
        ]);

        // Preparar dados de um parceiro falso
        $partnerData = [
            'name' => 'João Parceiro Teste',
            'email' => 'joao.parceiro@exemplo.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'company_name' => 'Empresa de Teste Lda',
            'phone_number' => '912345678',
            'role' => 'revendedor',
            'business_model' => 'B2B',
            'alvara' => UploadedFile::fake()->create('alvara.pdf', 1024, 'application/pdf'), // Ficheiro de alvará falso
        ];

        // 2. Ação (Act)
        $response = $this->postJson('/api/register', $partnerData);

        // 3. Verificações (Assert)
        
        // Verificar se a resposta HTTP tem o status 201 (Created)
        $response->assertStatus(201)
                 ->assertJson([
                     'message' => 'Registro realizado com sucesso! Verifique seu email para ativar a conta.'
                 ])
                 ->assertJsonStructure([
                     'message',
                     'user' => [
                         'id',
                         'name',
                         'email',
                         'role',
                         'status'
                     ]
                 ]);

        // Verificar se o novo utilizador foi criado na base de dados
        $this->assertDatabaseHas('users', [
            'name' => 'João Parceiro Teste',
            'email' => 'joao.parceiro@exemplo.com',
            'role' => 'revendedor',
            'status' => 'pending_email_validation',
        ]);

        // Verificar se o perfil do parceiro foi criado na base de dados
        $user = User::where('email', 'joao.parceiro@exemplo.com')->first();
        $this->assertNotNull($user);
        
        $this->assertDatabaseHas('partner_profiles', [
            'user_id' => $user->id,
            'company_name' => 'Empresa de Teste Lda',
            'phone_number' => '912345678',
            'business_model' => 'B2B',
        ]);

        // Verificar se o ficheiro do alvará foi guardado
        // Nota: O sistema usa o disco 'local' para guardar os alvarás, não 'private'
        Storage::disk('local')->assertExists('alvaras');
        
        // Verificar se existe pelo menos um ficheiro na pasta alvaras
        $files = Storage::disk('local')->files('alvaras');
        $this->assertNotEmpty($files, 'O ficheiro do alvará deveria ter sido guardado');

        // Verificar se o ficheiro guardado tem o nome correto (alvara_{user_id}_...)
        $alvaraFile = $files[0];
        $this->assertStringContainsString('alvara_' . $user->id . '_', $alvaraFile);

        // Verificar se o evento Registered foi disparado
        Event::assertDispatched(Registered::class, function ($event) use ($user) {
            return $event->user->id === $user->id;
        });

        // Verificar que o AdminNewPartnerNotification NÃO foi enviado durante o registo
        // (só é enviado quando o utilizador verifica o email)
        Mail::assertNotSent(AdminNewPartnerNotification::class);
    }

    /**
     * Teste de registo de distribuidor
     */
    #[Test]
    public function test_a_new_distributor_can_be_registered_successfully(): void
    {
        // 1. Preparação (Arrange)
        Storage::fake('private');
        Mail::fake();

        // Preparar dados de um distribuidor falso
        $distributorData = [
            'name' => 'Maria Distribuidora Teste',
            'email' => 'maria.distribuidora@exemplo.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'company_name' => 'Distribuidora de Teste Lda',
            'phone_number' => '987654321',
            'role' => 'distribuidor',
            'business_model' => 'B2B',
            'alvara' => UploadedFile::fake()->create('alvara.jpg', 512, 'image/jpeg'),
        ];

        // 2. Ação (Act)
        $response = $this->postJson('/api/register', $distributorData);

        // 3. Verificações (Assert)
        $response->assertStatus(201);

        // Verificar se o distribuidor foi criado
        $this->assertDatabaseHas('users', [
            'email' => 'maria.distribuidora@exemplo.com',
            'role' => 'distribuidor',
            'status' => 'pending_email_validation',
        ]);

        // Verificar se o perfil foi criado
        $user = User::where('email', 'maria.distribuidora@exemplo.com')->first();
        $this->assertDatabaseHas('partner_profiles', [
            'user_id' => $user->id,
            'company_name' => 'Distribuidora de Teste Lda',
            'business_model' => 'B2B',
        ]);

        // Verificar se o ficheiro foi guardado
        Storage::disk('local')->assertExists('alvaras');
        $files = Storage::disk('local')->files('alvaras');
        $this->assertNotEmpty($files);
    }
}
