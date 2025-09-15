<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ForceEmailVerification extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'force:email-verification {email} {--dry-run : Show what would be done without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Force email verification for a specific user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        $dryRun = $this->option('dry-run');

        $this->info("🔧 Forçando verificação de email para: {$email}");
        $this->line('');

        if ($dryRun) {
            $this->info('🔍 Modo de simulação - nenhuma alteração será feita');
        } else {
            $this->info('⚠️  ATENÇÃO: Esta operação irá forçar a verificação do email!');
        }
        
        $this->line('');

        // Buscar o usuário
        $user = User::where('email', $email)->first();
        
        if (!$user) {
            $this->error("❌ Usuário não encontrado com email: {$email}");
            return;
        }

        $this->showUserStatus($user);

        if (!$dryRun && !$this->confirm('Deseja continuar com a verificação forçada?')) {
            $this->info('Operação cancelada');
            return;
        }

        try {
            DB::beginTransaction();

            // Marcar email como verificado
            if (!$user->hasVerifiedEmail()) {
                if ($dryRun) {
                    $this->line("✅ [SIMULAÇÃO] Email seria marcado como verificado");
                } else {
                    $user->markEmailAsVerified();
                    $this->line("✅ Email marcado como verificado");
                }
            } else {
                $this->line("ℹ️  Email já estava verificado");
            }

            // Atualizar status para pending_approval
            if ($user->status !== 'pending_approval') {
                $oldStatus = $user->status;
                if ($dryRun) {
                    $this->line("✅ [SIMULAÇÃO] Status seria alterado de '{$oldStatus}' para 'pending_approval'");
                } else {
                    $user->update(['status' => 'pending_approval']);
                    $this->line("✅ Status alterado de '{$oldStatus}' para 'pending_approval'");
                }
            } else {
                $this->line("ℹ️  Status já estava como 'pending_approval'");
            }

            if (!$dryRun) {
                DB::commit();
                $this->line('');
                $this->info("✅ Verificação de email forçada com sucesso!");
                
                // Mostrar status final
                $user->refresh();
                $this->showUserStatus($user);
            } else {
                $this->line('');
                $this->info("✅ Simulação concluída - para executar use sem --dry-run");
            }

        } catch (\Exception $e) {
            if (!$dryRun) {
                DB::rollBack();
            }
            $this->error("❌ Erro durante a verificação forçada: " . $e->getMessage());
        }
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
}

