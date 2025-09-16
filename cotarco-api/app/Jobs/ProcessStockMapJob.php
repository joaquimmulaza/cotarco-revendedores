<?php

namespace App\Jobs;

use App\Models\ProductPrice;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Concerns\ToArray;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ProcessStockMapJob implements ShouldQueue
{
    use Queueable;

    protected $filePath;

    /**
     * Create a new job instance.
     */
    public function __construct(string $filePath)
    {
        $this->filePath = $filePath;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info('ProcessStockMapJob iniciado', ['file_path' => $this->filePath]);

            // Verificar se o arquivo existe
            if (!file_exists($this->filePath)) {
                Log::error('Arquivo não encontrado', ['file_path' => $this->filePath]);
                throw new \Exception("Arquivo não encontrado: {$this->filePath}");
            }

            // Ler o arquivo Excel
            $data = Excel::toArray(new class implements ToArray, WithHeadingRow {
                public function array(array $array): array
                {
                    return $array;
                }
            }, $this->filePath);

            if (empty($data) || empty($data[0])) {
                Log::warning('Arquivo Excel vazio ou sem dados', ['file_path' => $this->filePath]);
                return;
            }

            $rows = $data[0];
            $processedCount = 0;
            $errorCount = 0;

            Log::info('Iniciando processamento das linhas', ['total_rows' => count($rows)]);

            foreach ($rows as $index => $row) {
                try {
                    // Verificar se as colunas necessárias existem
                    if (!isset($row['SKU']) || empty($row['SKU'])) {
                        Log::warning('Linha sem SKU válido', ['row_index' => $index + 1, 'row_data' => $row]);
                        $errorCount++;
                        continue;
                    }

                    $sku = trim($row['SKU']);
                    $priceRevendedor = isset($row['Preco_Revendedor']) && !empty($row['Preco_Revendedor']) 
                        ? (float) str_replace(',', '.', $row['Preco_Revendedor']) 
                        : null;
                    $priceDistribuidor = isset($row['Preco_Distribuidor']) && !empty($row['Preco_Distribuidor']) 
                        ? (float) str_replace(',', '.', $row['Preco_Distribuidor']) 
                        : null;

                    // Usar updateOrCreate para atualizar ou criar o registro
                    ProductPrice::updateOrCreate(
                        ['product_sku' => $sku],
                        [
                            'price_revendedor' => $priceRevendedor,
                            'price_distribuidor' => $priceDistribuidor,
                        ]
                    );

                    $processedCount++;
                    
                    if ($processedCount % 100 === 0) {
                        Log::info('Progresso do processamento', ['processed' => $processedCount, 'total' => count($rows)]);
                    }

                } catch (\Exception $e) {
                    Log::error('Erro ao processar linha', [
                        'row_index' => $index + 1,
                        'sku' => $row['SKU'] ?? 'N/A',
                        'error' => $e->getMessage(),
                        'row_data' => $row
                    ]);
                    $errorCount++;
                }
            }

            Log::info('ProcessStockMapJob concluído com sucesso', [
                'file_path' => $this->filePath,
                'total_rows' => count($rows),
                'processed_count' => $processedCount,
                'error_count' => $errorCount
            ]);

        } catch (\Exception $e) {
            Log::error('Erro fatal no ProcessStockMapJob', [
                'file_path' => $this->filePath,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            throw $e;
        }
    }
}
