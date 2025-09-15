<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;

class CheckProductionPermissions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'check:production-permissions';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check production permissions and storage configuration';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔍 Verificando permissões e configuração de produção');
        $this->line('');

        $this->checkStorageDirectories();
        $this->checkFilePermissions();
        $this->checkConfiguration();
    }

    private function checkStorageDirectories()
    {
        $this->info('📁 Verificando diretórios de armazenamento...');

        $directories = [
            storage_path('app'),
            storage_path('app/private'),
            storage_path('app/public'),
            storage_path('app/private/alvaras'),
            storage_path('logs'),
            storage_path('framework/cache'),
            storage_path('framework/sessions'),
            storage_path('framework/views'),
        ];

        foreach ($directories as $dir) {
            if (File::exists($dir)) {
                if (File::isWritable($dir)) {
                    $this->line("✅ {$dir} - Existe e é gravável");
                } else {
                    $this->error("❌ {$dir} - Existe mas NÃO é gravável");
                }
            } else {
                $this->warn("⚠️  {$dir} - Não existe");
                
                // Tentar criar o diretório
                try {
                    File::makeDirectory($dir, 0755, true);
                    $this->line("✅ {$dir} - Criado com sucesso");
                } catch (\Exception $e) {
                    $this->error("❌ {$dir} - Erro ao criar: " . $e->getMessage());
                }
            }
        }
    }

    private function checkFilePermissions()
    {
        $this->line('');
        $this->info('🔐 Verificando permissões de arquivos...');

        $files = [
            storage_path('logs/laravel.log'),
            base_path('.env'),
            base_path('database/database.sqlite'),
        ];

        foreach ($files as $file) {
            if (File::exists($file)) {
                $perms = substr(sprintf('%o', fileperms($file)), -4);
                $this->line("📄 {$file} - Permissões: {$perms}");
            } else {
                $this->warn("⚠️  {$file} - Não existe");
            }
        }
    }

    private function checkConfiguration()
    {
        $this->line('');
        $this->info('⚙️  Verificando configuração...');

        // Verificar configuração de filesystem
        $defaultDisk = config('filesystems.default');
        $this->line("Disco padrão: {$defaultDisk}");

        $localDiskRoot = config('filesystems.disks.local.root');
        $this->line("Root do disco local: {$localDiskRoot}");

        // Verificar se o diretório do disco local existe e é gravável
        if (File::exists($localDiskRoot)) {
            if (File::isWritable($localDiskRoot)) {
                $this->line("✅ Diretório do disco local é gravável");
            } else {
                $this->error("❌ Diretório do disco local NÃO é gravável");
            }
        } else {
            $this->warn("⚠️  Diretório do disco local não existe");
        }

        // Verificar configuração de banco de dados
        $dbConnection = config('database.default');
        $this->line("Conexão de BD: {$dbConnection}");

        // Verificar configuração de email
        $mailDriver = config('mail.default');
        $this->line("Driver de email: {$mailDriver}");

        // Verificar configuração de app
        $appUrl = config('app.url');
        $this->line("URL da aplicação: {$appUrl}");

        $appDebug = config('app.debug');
        $this->line("Modo debug: " . ($appDebug ? 'Ativado' : 'Desativado'));

        if ($appDebug) {
            $this->warn("⚠️  Modo debug está ativado em produção!");
        }
    }
}

