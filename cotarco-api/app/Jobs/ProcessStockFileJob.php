<?php

namespace App\Jobs;

use App\Models\ProductPrice;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Concerns\ToArray;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ProcessStockFileJob implements ShouldQueue
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
            Log::info('ProcessStockFileJob iniciado', ['file_path' => $this->filePath]);

            // Verificar se o arquivo existe
            if (!file_exists($this->filePath)) {
                Log::error('Arquivo não encontrado', ['file_path' => $this->filePath]);
                throw new \Exception("Arquivo não encontrado: {$this->filePath}");
            }

            // Importar dados do Excel usando maatwebsite/excel
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

            // Iterar sobre cada linha do Excel
            foreach ($rows as $index => $row) {
                try {
                    // Verificar se as colunas necessárias existem
                    if (!isset($row['SKU']) || empty($row['SKU'])) {
                        Log::error('Linha sem SKU válido', [
                            'row_number' => $index + 1,
                            'row_data' => $row
                        ]);
                        $errorCount++;
                        continue;
                    }

                    $sku = trim($row['SKU']);
                    
                    // Processar preço do revendedor
                    $priceRevendedor = null;
                    if (isset($row['Preco_Revendedor']) && !empty($row['Preco_Revendedor'])) {
                        $priceRevendedor = $this->parsePrice($row['Preco_Revendedor']);
                        if ($priceRevendedor === false) {
                            Log::error('Preço do revendedor inválido', [
                                'row_number' => $index + 1,
                                'sku' => $sku,
                                'price_value' => $row['Preco_Revendedor']
                            ]);
                            $errorCount++;
                            continue;
                        }
                    }

                    // Processar preço do distribuidor
                    $priceDistribuidor = null;
                    if (isset($row['Preco_Distribuidor']) && !empty($row['Preco_Distribuidor'])) {
                        $priceDistribuidor = $this->parsePrice($row['Preco_Distribuidor']);
                        if ($priceDistribuidor === false) {
                            Log::error('Preço do distribuidor inválido', [
                                'row_number' => $index + 1,
                                'sku' => $sku,
                                'price_value' => $row['Preco_Distribuidor']
                            ]);
                            $errorCount++;
                            continue;
                        }
                    }

                    // Usar updateOrCreate no modelo ProductPrice
                    ProductPrice::updateOrCreate(
                        ['product_sku' => $sku],
                        [
                            'price_revendedor' => $priceRevendedor,
                            'price_distribuidor' => $priceDistribuidor,
                        ]
                    );

                    $processedCount++;

                } catch (\Exception $e) {
                    Log::error('Erro ao processar linha', [
                        'row_number' => $index + 1,
                        'sku' => $row['SKU'] ?? 'N/A',
                        'error' => $e->getMessage(),
                        'row_data' => $row
                    ]);
                    $errorCount++;
                }
            }

            Log::info('ProcessStockFileJob concluído', [
                'file_path' => $this->filePath,
                'total_rows' => count($rows),
                'processed_count' => $processedCount,
                'error_count' => $errorCount
            ]);

        } catch (\Exception $e) {
            Log::error('Erro fatal no ProcessStockFileJob', [
                'file_path' => $this->filePath,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            throw $e;
        }
    }

    /**
     * Parse price value from Excel cell
     */
    private function parsePrice($value)
    {
        if (is_numeric($value)) {
            return (float) $value;
        }

        // Remove espaços e converte vírgula para ponto
        $cleanValue = str_replace([' ', ','], ['', '.'], trim($value));
        
        if (is_numeric($cleanValue)) {
            return (float) $cleanValue;
        }

        return false;
    }
}
