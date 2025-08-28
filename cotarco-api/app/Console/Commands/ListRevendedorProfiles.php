<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\RevendedorProfile;

class ListRevendedorProfiles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'revendedores:list-profiles';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'List all revendedor profiles in the database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Listando todos os perfis de revendedor:');
        $this->line('');

        $profiles = RevendedorProfile::with('user:id,name,email')->get();

        if ($profiles->isEmpty()) {
            $this->warn('Nenhum perfil de revendedor encontrado.');
            return 0;
        }

        $this->table(
            ['ID', 'User ID', 'Nome', 'Email', 'Empresa', 'Telefone', 'Alvará'],
            $profiles->map(function ($profile) {
                return [
                    $profile->id,
                    $profile->user_id,
                    $profile->user->name,
                    $profile->user->email,
                    $profile->company_name,
                    $profile->phone_number,
                    $profile->alvara_path,
                ];
            })
        );

        return 0;
    }
}


