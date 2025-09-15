<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;

class TestVerificationUrl extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:verification-url {email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test the corrected verification URL';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');

        $this->info("🔍 Testando URL de verificação corrigida para: {$email}");
        $this->line('');

        // Buscar o usuário
        $user = User::where('email', $email)->first();
        
        if (!$user) {
            $this->error("❌ Usuário não encontrado com email: {$email}");
            return;
        }

        // Gerar URL de verificação com a correção
        $verificationUrl = $this->generateCorrectedVerificationUrl($user);
        $this->line('');
        $this->info("🔗 URL de verificação corrigida:");
        $this->line($verificationUrl);

        // Verificar componentes da URL
        $this->line('');
        $this->info("🔍 Análise da URL corrigida:");
        
        $parsedUrl = parse_url($verificationUrl);
        $query = [];
        parse_str($parsedUrl['query'] ?? '', $query);
        
        $this->line("Host: " . ($parsedUrl['host'] ?? 'N/A'));
        $this->line("Path: " . ($parsedUrl['path'] ?? 'N/A'));
        $this->line("ID: " . ($query['id'] ?? 'N/A'));
        $this->line("Hash: " . ($query['hash'] ?? 'N/A'));
        $this->line("Expires: " . ($query['expires'] ?? 'N/A'));
        $this->line("Signature: " . ($query['signature'] ?? 'N/A'));

        // Verificar se o hash está correto
        $expectedHash = sha1($user->getEmailForVerification());
        $receivedHash = $query['hash'] ?? '';
        
        $this->line('');
        $this->info("🔐 Verificação de segurança:");
        
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

        $this->line('');
        $this->info("🧪 Teste a URL corrigida no navegador!");
    }

    private function generateCorrectedVerificationUrl($user)
    {
        // Usar a URL base correta sem o path do frontend
        $baseUrl = 'https://cotarco.com';
        
        return URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
            [
                'id' => $user->getKey(),
                'hash' => sha1($user->getEmailForVerification()),
            ],
            false, // Não usar HTTPS automaticamente
            $baseUrl // Usar a URL base correta
        );
    }
}
