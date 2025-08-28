<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class ListUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:list';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'List all users in the database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Listando todos os usuários:');
        $this->line('');

        $users = User::all(['id', 'name', 'email', 'role', 'status']);

        if ($users->isEmpty()) {
            $this->warn('Nenhum usuário encontrado.');
            return 0;
        }

        $this->table(
            ['ID', 'Nome', 'Email', 'Role', 'Status'],
            $users->map(function ($user) {
                return [
                    $user->id,
                    $user->name,
                    $user->email,
                    $user->role,
                    $user->status,
                ];
            })
        );

        return 0;
    }
}


