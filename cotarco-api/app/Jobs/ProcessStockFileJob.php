<?php

namespace App\Jobs;

use App\Models\ProductPrice;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Concerns\ToArray;

class ProcessStockFileJob implements ShouldQueue
{
    use Queueable;

    protected $filePath;
    protected $targetBusinessModel;

    /**
     * Create a new job instance.
     */
    public function __construct(string $filePath, string $targetBusinessModel)
    {
        $this->filePath = $filePath;
        $this->targetBusinessModel = $targetBusinessModel;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info('ProcessStockFileJob iniciado', ['file_path' => $this->filePath, 'target_business_model' => $this->targetBusinessModel]);

            // Verificar se o arquivo existe usando Storage Facade
            if (!Storage::disk('local')->exists($this->filePath)) {
                Log::error('Arquivo não encontrado', ['file_path' => $this->filePath]);
                throw new \Exception("Arquivo não encontrado: {$this->filePath}");
            }

            // Obter o caminho absoluto do arquivo
            $absolutePath = Storage::disk('local')->path($this->filePath);

            // Importar dados do Excel usando maatwebsite/excel
            $data = Excel::toArray(new class implements ToArray {
                public function array(array $array): array
                {
                    return $array;
                }
            }, $absolutePath);

            if (empty($data) || empty($data[0])) {
                Log::warning('Arquivo Excel vazio ou sem dados', ['file_path' => $absolutePath]);
                return;
            }

            $sheetData = $data[0];
            $headerRowIndex = -1;
            $skuColumnIndex = -1;
            $priceColumnIndex = -1;
            $headers = [];

            // 1. Encontrar a linha do cabeçalho (procurando nas primeiras 20 linhas)
            foreach (array_slice($sheetData, 0, 20) as $rowIndex => $row) {
                $normalizedRow = array_map('strtolower', array_filter($row)); // Normaliza para minúsculas
                $foundSku = false;
                $foundPrice = false;

                foreach ($normalizedRow as $cellIndex => $cellValue) {
                    if (str_contains($cellValue, 'referencia') || str_contains($cellValue, 'sku')) {
                        $foundSku = true;
                        $skuColumnIndex = $cellIndex;
                    }
                    if (str_contains($cellValue, 'preço') || str_contains($cellValue, 'preco')) {
                        $foundPrice = true;
                        $priceColumnIndex = $cellIndex;
                    }
                }

                if ($foundSku && $foundPrice) {
                    $headerRowIndex = $rowIndex;
                    $headers = array_map('strtolower', $row);
                    break; // Encontrámos o cabeçalho, podemos parar
                }
            }

            // 2. Se não encontrámos o cabeçalho, o ficheiro é inválido
            if ($headerRowIndex === -1) {
                Log::error('Linha de cabeçalho com colunas de Referencia e Preço não encontrada no ficheiro.');
                throw new \Exception('Ficheiro Excel num formato irreconhecível.');
            }

            Log::info('Cabeçalho encontrado na linha ' . ($headerRowIndex + 1), [
                'sku_column_index' => $skuColumnIndex,
                'price_column_index' => $priceColumnIndex
            ]);

            // 3. Processar as linhas de dados (a partir da linha a seguir ao cabeçalho)
            $dataRows = array_slice($sheetData, $headerRowIndex + 1);
            $processedCount = 0;
            $errorCount = 0;

            foreach ($dataRows as $index => $row) {
                try {
                    $sku = $row[$skuColumnIndex] ?? null;
                    $priceValue = $row[$priceColumnIndex] ?? null;
                    $parsedPrice = $this->parsePrice($priceValue);

                    if (empty(trim((string)$sku))) {
                        continue; // Ignora linhas sem SKU
                    }
                    if (!is_numeric($parsedPrice)) {
                        $errorCount++;
                        continue; // Ignora linhas com preço inválido
                    }

                    // Lógica para guardar na BD (mantém-se igual)
                    $dataToUpdate = [];
                    if ($this->targetBusinessModel === 'B2C') {
                        $dataToUpdate['price_b2c'] = $parsedPrice;
                    } elseif ($this->targetBusinessModel === 'B2B') {
                        $dataToUpdate['price_b2b'] = $parsedPrice;
                    }

                    if (!empty($dataToUpdate)) {
                        ProductPrice::updateOrCreate(
                            ['product_sku' => trim((string)$sku)],
                            $dataToUpdate
                        );
                        $processedCount++;
                    }
                } catch (\Exception $e) {
                    $errorCount++;
                    Log::error('Erro ao processar linha de dados', ['row_index' => $headerRowIndex + $index + 2, 'error' => $e->getMessage()]);
                }
            }

            Log::info('ProcessStockFileJob concluído', [
                'file_path' => $absolutePath,
                'total_rows' => count($dataRows),
                'processed_count' => $processedCount,
                'error_count' => $errorCount
            ]);

        } catch (\Exception $e) {
            Log::error('Erro fatal no ProcessStockFileJob', [
                'file_path' => $absolutePath ?? $this->filePath,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            throw $e;
        }
    }

    /**
     * Converte strings de preço formatadas (vírgulas como milhares, ponto como decimal) em float
     */
    private function parsePrice($priceString)
    {
        if ($priceString === null || trim($priceString) === '') {
            return null;
        }

        // Remove as vírgulas (separadores de milhares) da string.
        $cleanedString = str_replace(',', '', $priceString);

        // Após remover as vírgulas, verifica se o resultado é um número válido.
        // Isto previne erros se a célula contiver texto como "N/A".
        if (is_numeric($cleanedString)) {
            return (float) $cleanedString;
        }

        // Se não for um número válido após a limpeza, retorna nulo.
        return null;
    }
}
