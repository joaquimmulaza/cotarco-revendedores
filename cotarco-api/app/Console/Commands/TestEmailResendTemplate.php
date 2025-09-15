<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Notifications\CustomEmailVerificationResendNotification;

class TestEmailResendTemplate extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:email-resend-template {email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test the email resend template with a specific email address';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');

        // Buscar ou criar um usuário de teste
        $user = User::where('email', $email)->first();
        
        if (!$user) {
            $this->warn("Usuário com email '{$email}' não encontrado. Criando usuário de teste...");
            $user = User::create([
                'name' => 'Usuário de Teste',
                'email' => $email,
                'password' => bcrypt('password'),
                'role' => 'partner',
                'status' => 'pending_email_validation'
            ]);
        }

        $this->info("Enviando email de teste para: {$user->name} ({$user->email})");
        
        try {
            $user->notify(new CustomEmailVerificationResendNotification());
            $this->info("✅ Email de teste enviado com sucesso!");
            $this->info("Verifique a caixa de entrada do email: {$email}");
        } catch (\Exception $e) {
            $this->error("❌ Erro ao enviar email: " . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
