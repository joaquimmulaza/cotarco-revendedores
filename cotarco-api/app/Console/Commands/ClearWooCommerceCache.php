<?php

namespace App\Console\Commands;

use App\Services\WooCommerceService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ClearWooCommerceCache extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'wc:cache:clear';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Limpa/Invalida o cache de produtos e categorias do WooCommerce';

    /**
     * Execute the console command.
     */
    public function handle(WooCommerceService $wooCommerceService)
    {
        $this->info('Limpando cache do WooCommerce...');

        try {
            $ok = $wooCommerceService->clearWooCommerceCache();
            if ($ok) {
                $this->info('Cache invalidado com sucesso.');
                return 0;
            }
            $this->warn('Não foi possível invalidar o cache. Verifique os logs.');
            return 1;
        } catch (\Throwable $e) {
            Log::warning('Falha ao executar limpeza do cache do WooCommerce', [
                'exception' => $e->getMessage(),
            ]);
            $this->error('Erro ao limpar cache: ' . $e->getMessage());
            return 1;
        }
    }
}


