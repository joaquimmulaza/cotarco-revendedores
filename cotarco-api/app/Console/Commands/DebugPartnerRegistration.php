<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\PartnerProfile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class DebugPartnerRegistration extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'debug:partner-registration {email?} {--recent : Show recent registrations (last 7 days)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Debug partner registration issues';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        $recent = $this->option('recent');

        $this->info('🔍 Debug de Registro de Parceiros');
        $this->line('');

        if ($email) {
            $this->debugSpecificUser($email);
        } elseif ($recent) {
            $this->debugRecentRegistrations();
        } else {
            $this->debugGeneralStats();
        }
    }

    private function debugSpecificUser($email)
    {
        $this->info("📧 Verificando usuário: {$email}");
        $this->line('');

        $user = User::where('email', $email)->first();
        
        if (!$user) {
            $this->error("❌ Usuário não encontrado com email: {$email}");
            return;
        }

        $this->showUserDetails($user);
    }

    private function debugRecentRegistrations()
    {
        $this->info('📅 Registros recentes (últimos 7 dias)');
        $this->line('');

        $recentUsers = User::where('created_at', '>=', now()->subDays(7))
            ->orderBy('created_at', 'desc')
            ->get();

        if ($recentUsers->isEmpty()) {
            $this->warn('Nenhum registro encontrado nos últimos 7 dias');
            return;
        }

        foreach ($recentUsers as $user) {
            $this->line("---");
            $this->showUserDetails($user);
            $this->line('');
        }
    }

    private function debugGeneralStats()
    {
        $this->info('📊 Estatísticas Gerais');
        $this->line('');

        // Total de usuários
        $totalUsers = User::count();
        $this->line("Total de usuários: {$totalUsers}");

        // Usuários por status
        $statusCounts = User::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get();

        $this->line('');
        $this->info('Usuários por status:');
        foreach ($statusCounts as $status) {
            $this->line("  - {$status->status}: {$status->count}");
        }

        // Total de perfis de parceiros
        $totalProfiles = PartnerProfile::count();
        $this->line('');
        $this->line("Total de perfis de parceiros: {$totalProfiles}");

        // Usuários sem perfil
        $usersWithoutProfile = User::whereDoesntHave('partnerProfile')->count();
        $this->line("Usuários sem perfil de parceiro: {$usersWithoutProfile}");

        if ($usersWithoutProfile > 0) {
            $this->warn('');
            $this->warn('⚠️  PROBLEMA DETECTADO: Existem usuários sem perfil de parceiro!');
            $this->line('');
            
            $usersWithoutProfileList = User::whereDoesntHave('partnerProfile')
                ->select('id', 'name', 'email', 'status', 'created_at')
                ->get();

            $this->table(
                ['ID', 'Nome', 'Email', 'Status', 'Criado em'],
                $usersWithoutProfileList->map(function ($user) {
                    return [
                        $user->id,
                        $user->name,
                        $user->email,
                        $user->status,
                        $user->created_at->format('d/m/Y H:i:s')
                    ];
                })
            );
        }

        // Verificar arquivos órfãos
        $this->checkOrphanFiles();
    }

    private function showUserDetails($user)
    {
        $this->line("ID: {$user->id}");
        $this->line("Nome: {$user->name}");
        $this->line("Email: {$user->email}");
        $this->line("Status: {$user->status}");
        $this->line("Email verificado: " . ($user->hasVerifiedEmail() ? 'Sim' : 'Não'));
        $this->line("Criado em: {$user->created_at->format('d/m/Y H:i:s')}");
        $this->line("Atualizado em: {$user->updated_at->format('d/m/Y H:i:s')}");

        // Verificar perfil de parceiro
        $profile = $user->partnerProfile;
        if ($profile) {
            $this->line("✅ Perfil de parceiro: Existe (ID: {$profile->id})");
            $this->line("  - Empresa: {$profile->company_name}");
            $this->line("  - Telefone: {$profile->phone_number}");
            $this->line("  - Alvará: {$profile->alvara_path}");
            
            // Verificar se o arquivo existe
            if (Storage::disk('local')->exists($profile->alvara_path)) {
                $this->line("  - Arquivo do alvará: ✅ Existe");
            } else {
                $this->line("  - Arquivo do alvará: ❌ Não encontrado");
            }
        } else {
            $this->error("❌ Perfil de parceiro: NÃO EXISTE");
        }
    }

    private function checkOrphanFiles()
    {
        $this->line('');
        $this->info('🔍 Verificando arquivos órfãos...');

        $profiles = PartnerProfile::all();
        $orphanFiles = [];

        foreach ($profiles as $profile) {
            if (!Storage::disk('local')->exists($profile->alvara_path)) {
                $orphanFiles[] = [
                    'profile_id' => $profile->id,
                    'user_id' => $profile->user_id,
                    'file_path' => $profile->alvara_path
                ];
            }
        }

        if (!empty($orphanFiles)) {
            $this->warn("⚠️  Arquivos órfãos encontrados: " . count($orphanFiles));
            foreach ($orphanFiles as $orphan) {
                $this->line("  - Profile ID {$orphan['profile_id']} (User ID {$orphan['user_id']}): {$orphan['file_path']}");
            }
        } else {
            $this->line("✅ Todos os arquivos de alvará estão presentes");
        }
    }
}

