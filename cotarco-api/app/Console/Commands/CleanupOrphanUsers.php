<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\RevendedorProfile;
use Illuminate\Support\Facades\DB;

class CleanupOrphanUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:cleanup-orphans';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Remove orphaned users that were created during failed registration attempts';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Iniciando limpeza de usuários órfãos...');

        // Encontrar usuários que não têm perfil de revendedor
        $orphanUsers = User::where('role', 'revendedor')
            ->whereDoesntHave('revendedorProfile')
            ->get();

        if ($orphanUsers->isEmpty()) {
            $this->info('Nenhum usuário órfão encontrado.');
            return 0;
        }

        $this->warn("Encontrados {$orphanUsers->count()} usuários órfãos:");

        foreach ($orphanUsers as $user) {
            $this->line("- ID: {$user->id}, Nome: {$user->name}, Email: {$user->email}, Status: {$user->status}");
        }

        if ($this->confirm('Deseja remover estes usuários órfãos?')) {
            DB::beginTransaction();
            
            try {
                $deletedCount = 0;
                
                foreach ($orphanUsers as $user) {
                    // Remover arquivos de alvará se existirem
                    if ($user->revendedorProfile && $user->revendedorProfile->alvara_path) {
                        \Storage::disk('local')->delete($user->revendedorProfile->alvara_path);
                    }
                    
                    // Remover o usuário (cascade irá remover o perfil)
                    $user->delete();
                    $deletedCount++;
                }
                
                DB::commit();
                $this->info("Removidos {$deletedCount} usuários órfãos com sucesso.");
                
            } catch (\Exception $e) {
                DB::rollBack();
                $this->error("Erro ao remover usuários órfãos: " . $e->getMessage());
                return 1;
            }
        } else {
            $this->info('Operação cancelada.');
        }

        return 0;
    }
}



