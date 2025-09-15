<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;

class CheckEmailVerificationRoute extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'check:email-verification-route {email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check if email verification route is working correctly';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');

        $this->info("🔍 Verificando rota de verificação de email para: {$email}");
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

        // Verificar componentes da URL
        $this->line('');
        $this->info("🔍 Análise da URL:");
        
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

        // Verificar configuração da aplicação
        $this->line('');
        $this->info("⚙️  Configuração da aplicação:");
        $this->line("APP_URL: " . config('app.url'));
        $this->line("APP_KEY: " . (config('app.key') ? 'Definida' : 'NÃO DEFINIDA'));
        $this->line("FRONTEND_URL: " . env('FRONTEND_URL', 'NÃO DEFINIDA'));

        // Verificar se a rota está registrada
        $this->line('');
        $this->info("🛣️  Verificação de rotas:");
        
        $routes = app('router')->getRoutes();
        $verificationRoute = null;
        
        foreach ($routes as $route) {
            if ($route->getName() === 'verification.verify') {
                $verificationRoute = $route;
                break;
            }
        }
        
        if ($verificationRoute) {
            $this->line("✅ Rota 'verification.verify' encontrada");
            $this->line("Método: " . implode('|', $verificationRoute->methods()));
            $this->line("URI: " . $verificationRoute->uri());
        } else {
            $this->error("❌ Rota 'verification.verify' NÃO encontrada");
        }

        $this->line('');
        $this->info("🧪 Próximos passos:");
        $this->line("1. Acesse a URL acima no navegador");
        $this->line("2. Verifique os logs: tail -f storage/logs/laravel.log");
        $this->line("3. Procure por 'VERIFICAÇÃO DE EMAIL INICIADA' nos logs");
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

