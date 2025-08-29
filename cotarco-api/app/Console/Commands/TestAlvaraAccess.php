<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class TestAlvaraAccess extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:alvara-access {user_id} {admin_token}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test alvara access with admin token';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $userId = $this->argument('user_id');
        $token = $this->argument('admin_token');
        
        $user = User::find($userId);
        if (!$user) {
            $this->error("Usuário com ID {$userId} não encontrado.");
            return 1;
        }

        $this->info("Testando acesso ao alvará do usuário: {$user->name} (ID: {$userId})");
        
        $url = "http://localhost:8000/api/admin/revendedores/{$userId}/alvara?token={$token}";
        
        $this->line("URL gerada: {$url}");
        $this->info("Copie esta URL e cole no navegador para testar.");
        
        // Verificar se o arquivo existe
        if ($user->revendedorProfile && $user->revendedorProfile->alvara_path) {
            $alvaraPath = $user->revendedorProfile->alvara_path;
            $this->line("Caminho do alvará: {$alvaraPath}");
            
            if (\Storage::disk('local')->exists($alvaraPath)) {
                $this->info("✅ Arquivo do alvará existe no servidor.");
                $fileSize = \Storage::disk('local')->size($alvaraPath);
                $this->line("Tamanho do arquivo: " . number_format($fileSize / 1024, 2) . " KB");
            } else {
                $this->error("❌ Arquivo do alvará NÃO existe no servidor.");
            }
        } else {
            $this->error("❌ Usuário não possui perfil de revendedor ou caminho do alvará.");
        }

        return 0;
    }
}



