<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;

class TestEmailVerification extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:email-verification {email} {--send : Send actual verification email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test email verification process for a specific user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        $sendEmail = $this->option('send');

        $this->info("🔍 Testando verificação de email para: {$email}");
        $this->line('');

        // Buscar o usuário
        $user = User::where('email', $email)->first();
        
        if (!$user) {
            $this->error("❌ Usuário não encontrado com email: {$email}");
            return;
        }

        $this->showUserStatus($user);

        // Gerar URL de verificação
        $verificationUrl = $this->generateVerificationUrl($user);
        $this->line('');
        $this->info("🔗 URL de verificação gerada:");
        $this->line($verificationUrl);

        // Verificar se a URL é válida
        $this->line('');
        $this->info("🔍 Verificando URL...");
        
        $parsedUrl = parse_url($verificationUrl);
        $query = [];
        parse_str($parsedUrl['query'] ?? '', $query);
        
        $this->line("ID: " . ($query['id'] ?? 'N/A'));
        $this->line("Hash: " . ($query['hash'] ?? 'N/A'));
        $this->line("Expires: " . ($query['expires'] ?? 'N/A'));
        $this->line("Signature: " . ($query['signature'] ?? 'N/A'));

        // Verificar se o hash está correto
        $expectedHash = sha1($user->getEmailForVerification());
        $receivedHash = $query['hash'] ?? '';
        
        if (hash_equals($expectedHash, $receivedHash)) {
            $this->line("✅ Hash está correto");
        } else {
            $this->error("❌ Hash incorreto");
            $this->line("Esperado: {$expectedHash}");
            $this->line("Recebido: {$receivedHash}");
        }

        // Verificar expiração
        $expires = $query['expires'] ?? 0;
        $expiresAt = Carbon::createFromTimestamp($expires);
        $now = Carbon::now();
        
        if ($expiresAt->isFuture()) {
            $this->line("✅ URL ainda é válida (expira em: {$expiresAt->diffForHumans()})");
        } else {
            $this->error("❌ URL expirada (expirou em: {$expiresAt->diffForHumans()})");
        }

        if ($sendEmail) {
            $this->line('');
            $this->info("📧 Enviando email de verificação...");
            
            try {
                $user->sendEmailVerificationNotification();
                $this->line("✅ Email enviado com sucesso!");
            } catch (\Exception $e) {
                $this->error("❌ Erro ao enviar email: " . $e->getMessage());
            }
        } else {
            $this->line('');
            $this->info("💡 Para enviar o email de verificação, use: --send");
        }

        $this->line('');
        $this->info("🧪 Para testar a verificação, acesse a URL acima no navegador");
    }

    private function showUserStatus($user)
    {
        $this->info("👤 Status do usuário:");
        $this->line("  ID: {$user->id}");
        $this->line("  Nome: {$user->name}");
        $this->line("  Email: {$user->email}");
        $this->line("  Status: {$user->status}");
        $this->line("  Email verificado: " . ($user->hasVerifiedEmail() ? 'Sim' : 'Não'));
        $this->line("  Email verificado em: " . ($user->email_verified_at ? $user->email_verified_at->format('d/m/Y H:i:s') : 'Nunca'));
        $this->line("  Criado em: {$user->created_at->format('d/m/Y H:i:s')}");
    }

    private function generateVerificationUrl($user)
    {
        return URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
            [
                'id' => $user->getKey(),
                'hash' => sha1($user->getEmailForVerification()),
            ]
        );
    }
}