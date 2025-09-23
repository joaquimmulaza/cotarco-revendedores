<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class FixEmailVerificationIssues extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fix:email-verification {--dry-run : Apenas mostrar o que seria corrigido} {--force : Forçar correção sem confirmação}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Corrigir inconsistências de verificação de email';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $force = $this->option('force');

        $this->info('🔧 Correção de Inconsistências de Verificação de Email');
        $this->line('');

        if ($dryRun) {
            $this->warn('🎭 Modo DRY-RUN - apenas mostrando o que seria corrigido');
            $this->line('');
        }

        $issues = $this->findIssues();
        
        if (empty($issues)) {
            $this->info('✅ Nenhuma inconsistência encontrada!');
            return 0;
        }

        $this->info("🔍 Encontradas " . count($issues) . " inconsistências:");
        $this->line('');

        foreach ($issues as $issue) {
            $this->displayIssue($issue);
        }

        if ($dryRun) {
            $this->line('');
            $this->info('🎭 Modo DRY-RUN - nenhuma alteração foi feita');
            return 0;
        }

        if (!$force) {
            if (!$this->confirm('Deseja corrigir estas inconsistências?')) {
                $this->info('❌ Operação cancelada pelo usuário');
                return 0;
            }
        }

        $this->line('');
        $this->info('🔧 Aplicando correções...');
        
        $fixed = 0;
        $errors = 0;

        foreach ($issues as $issue) {
            try {
                $this->fixIssue($issue);
                $fixed++;
                $this->info("✅ Corrigido: {$issue['user']->email}");
            } catch (\Exception $e) {
                $errors++;
                $this->error("❌ Erro ao corrigir {$issue['user']->email}: " . $e->getMessage());
                Log::error('Erro ao corrigir inconsistência de verificação', [
                    'user_id' => $issue['user']->id,
                    'email' => $issue['user']->email,
                    'issue_type' => $issue['type'],
                    'error' => $e->getMessage()
                ]);
            }
        }

        $this->line('');
        $this->info("🎉 Correção concluída!");
        $this->line("   ✅ Corrigidos: {$fixed}");
        $this->line("   ❌ Erros: {$errors}");

        return 0;
    }

    private function findIssues()
    {
        $issues = [];
        
        // Buscar usuários com status pending_email_validation mas email já verificado
        $usersWithVerifiedEmailButPendingStatus = User::where('status', 'pending_email_validation')
            ->whereNotNull('email_verified_at')
            ->get();

        foreach ($usersWithVerifiedEmailButPendingStatus as $user) {
            $issues[] = [
                'user' => $user,
                'type' => 'verified_but_pending_status',
                'description' => 'Email verificado mas status ainda é pending_email_validation'
            ];
        }

        // Buscar usuários com status pending_approval mas email não verificado
        $usersWithPendingApprovalButUnverifiedEmail = User::where('status', 'pending_approval')
            ->whereNull('email_verified_at')
            ->get();

        foreach ($usersWithPendingApprovalButUnverifiedEmail as $user) {
            $issues[] = [
                'user' => $user,
                'type' => 'pending_approval_but_unverified',
                'description' => 'Status é pending_approval mas email não foi verificado'
            ];
        }

        return $issues;
    }

    private function displayIssue($issue)
    {
        $user = $issue['user'];
        $this->line("👤 {$user->name} ({$user->email})");
        $this->line("   ID: {$user->id}");
        $this->line("   Status: {$user->status}");
        $this->line("   Email verificado: " . ($user->hasVerifiedEmail() ? 'Sim' : 'Não'));
        $this->line("   Problema: {$issue['description']}");
        $this->line('');
    }

    private function fixIssue($issue)
    {
        $user = $issue['user'];
        
        switch ($issue['type']) {
            case 'verified_but_pending_status':
                // Email já foi verificado, atualizar status para pending_approval
                $user->update(['status' => 'pending_approval']);
                Log::info('Corrigido: Status atualizado para pending_approval', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'old_status' => 'pending_email_validation',
                    'new_status' => 'pending_approval'
                ]);
                break;

            case 'pending_approval_but_unverified':
                // Status é pending_approval mas email não foi verificado
                // Marcar email como verificado
                $user->markEmailAsVerified();
                Log::info('Corrigido: Email marcado como verificado', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'status' => $user->status
                ]);
                break;
        }
    }
}






