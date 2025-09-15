<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\PartnerProfile;
use Illuminate\Support\Facades\DB;

class FixOrphanUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fix:orphan-users {--dry-run : Show what would be fixed without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix users without partner profiles';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        
        if ($dryRun) {
            $this->info('🔍 Modo de simulação - nenhuma alteração será feita');
        } else {
            $this->info('🔧 Corrigindo usuários órfãos...');
        }
        
        $this->line('');

        // Encontrar usuários sem perfil de parceiro
        $orphanUsers = User::whereDoesntHave('partnerProfile')
            ->where('status', '!=', 'pending_email_validation') // Excluir usuários que ainda não validaram email
            ->get();

        if ($orphanUsers->isEmpty()) {
            $this->info('✅ Nenhum usuário órfão encontrado');
            return;
        }

        $this->warn("⚠️  Encontrados {$orphanUsers->count()} usuários órfãos:");
        $this->line('');

        foreach ($orphanUsers as $user) {
            $this->line("ID: {$user->id} | Nome: {$user->name} | Email: {$user->email} | Status: {$user->status}");
        }

        $this->line('');

        if ($dryRun) {
            $this->info('Para corrigir estes usuários, execute: php artisan fix:orphan-users');
            return;
        }

        if (!$this->confirm('Deseja corrigir estes usuários órfãos?')) {
            $this->info('Operação cancelada');
            return;
        }

        $fixed = 0;
        $errors = 0;

        foreach ($orphanUsers as $user) {
            try {
                DB::beginTransaction();

                // Criar perfil de parceiro básico
                $profile = PartnerProfile::create([
                    'user_id' => $user->id,
                    'company_name' => $user->name . ' - Empresa',
                    'phone_number' => 'N/A',
                    'alvara_path' => 'alvaras/placeholder_' . $user->id . '.pdf',
                ]);

                // Atualizar status se necessário
                if ($user->status === 'pending_email_validation') {
                    $user->update(['status' => 'pending_approval']);
                }

                DB::commit();
                
                $this->line("✅ Corrigido: {$user->name} ({$user->email})");
                $fixed++;

            } catch (\Exception $e) {
                DB::rollBack();
                $this->error("❌ Erro ao corrigir {$user->name}: " . $e->getMessage());
                $errors++;
            }
        }

        $this->line('');
        $this->info("📊 Resultado:");
        $this->line("  - Corrigidos: {$fixed}");
        $this->line("  - Erros: {$errors}");
        
        if ($fixed > 0) {
            $this->info("✅ Usuários órfãos corrigidos com sucesso!");
        }
    }
}

