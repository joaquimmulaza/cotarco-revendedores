<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use App\Mail\AdminNewPartnerNotification;
use App\Models\User;

class TestEmailCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:email {email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test email sending functionality';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        
        // Criar um utilizador fictício para teste
        $testUser = new User([
            'name' => 'Teste Parceiro',
            'email' => 'teste@exemplo.com',
            'role' => 'revendedor',
            'status' => 'pending_approval',
            'created_at' => now(),
            'updated_at' => now()
        ]);
        
        $dashboardUrl = env('FRONTEND_URL', 'http://localhost:5173') . '/admin';
        
        try {
            Mail::to($email)->send(new AdminNewPartnerNotification($testUser, $dashboardUrl));
            $this->info("Email enviado com sucesso para: {$email}");
        } catch (\Exception $e) {
            $this->error("Erro ao enviar email: " . $e->getMessage());
        }
    }
}