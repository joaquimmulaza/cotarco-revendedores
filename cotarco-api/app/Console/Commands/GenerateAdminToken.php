<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class GenerateAdminToken extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:generate-token {email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate a token for an admin user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        
        $admin = User::where('email', $email)->where('role', 'admin')->first();
        
        if (!$admin) {
            $this->error("Admin com email '{$email}' não encontrado.");
            return 1;
        }

        $token = $admin->createToken('test-token')->plainTextToken;
        
        $this->info("Token gerado para {$admin->name} ({$admin->email}):");
        $this->line($token);
        
        return 0;
    }
}




