<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Auth\Events\Registered;

class ResendVerificationEmail extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:resend-verification {email?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Resend verification email to users with pending email validation';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');

        if ($email) {
            // Reenviar para um usuário específico
            $user = User::where('email', $email)->first();
            
            if (!$user) {
                $this->error("Usuário com email '{$email}' não encontrado.");
                return 1;
            }

            if ($user->status !== 'pending_email_validation') {
                $this->warn("Usuário '{$email}' não está com status 'pending_email_validation' (atual: {$user->status}).");
                return 1;
            }

            $this->info("Reenviando email de verificação para: {$user->name} ({$user->email})");
            event(new Registered($user));
            $this->info("Email de verificação reenviado com sucesso!");
            
        } else {
            // Reenviar para todos os usuários pendentes
            $pendingUsers = User::where('status', 'pending_email_validation')->get();
            
            if ($pendingUsers->isEmpty()) {
                $this->info('Nenhum usuário com verificação de email pendente encontrado.');
                return 0;
            }

            $this->info("Encontrados {$pendingUsers->count()} usuários com verificação pendente:");
            
            foreach ($pendingUsers as $user) {
                $this->line("- {$user->name} ({$user->email})");
            }

            if ($this->confirm('Deseja reenviar emails de verificação para todos estes usuários?')) {
                $bar = $this->output->createProgressBar($pendingUsers->count());
                $bar->start();

                foreach ($pendingUsers as $user) {
                    event(new Registered($user));
                    $bar->advance();
                }

                $bar->finish();
                $this->newLine();
                $this->info("Emails de verificação reenviados com sucesso!");
            } else {
                $this->info('Operação cancelada.');
            }
        }

        return 0;
    }
}


