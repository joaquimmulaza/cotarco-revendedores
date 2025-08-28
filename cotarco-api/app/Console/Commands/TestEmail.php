<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class TestEmail extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'email:test {to}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test email configuration by sending a test email';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $to = $this->argument('to');
        
        $this->info("Enviando email de teste para: {$to}");

        try {
            Mail::raw('Este é um email de teste do sistema Cotarco. Se você recebeu esta mensagem, o sistema de email está funcionando corretamente!', function ($message) use ($to) {
                $message->to($to)
                        ->subject('Teste de Email - Cotarco');
            });

            $this->info('Email de teste enviado com sucesso!');
            $this->line('Verifique a caixa de entrada (e spam) do destinatário.');
            
        } catch (\Exception $e) {
            $this->error('Erro ao enviar email de teste: ' . $e->getMessage());
            
            // Mostrar detalhes do erro se em modo debug
            if (config('app.debug')) {
                $this->line('Detalhes do erro:');
                $this->line($e->getTraceAsString());
            }
            
            return 1;
        }

        return 0;
    }
}


