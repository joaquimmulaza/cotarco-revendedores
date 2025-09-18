<?php

namespace App\Jobs;

use App\Models\ProductPrice;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Concerns\ToArray;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ProcessStockFileJob implements ShouldQueue
{
    use Queueable;

    protected $filePath;
    protected $targetRole;

    /**
     * Create a new job instance.
     */
    public function __construct(string $filePath, string $targetRole)
    {
        $this->filePath = $filePath;
        $this->targetRole = $targetRole;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info('ProcessStockFileJob iniciado', ['file_path' => $this->filePath, 'target_role' => $this->targetRole]);

            // Verificar se o arquivo existe usando Storage Facade
            if (!Storage::disk('local')->exists($this->filePath)) {
                Log::error('Arquivo não encontrado', ['file_path' => $this->filePath]);
                throw new \Exception("Arquivo não encontrado: {$this->filePath}");
            }

            // Obter o caminho absoluto do arquivo
            $absolutePath = Storage::disk('local')->path($this->filePath);

            // Importar dados do Excel usando maatwebsite/excel
            $data = Excel::toArray(new class implements ToArray, WithHeadingRow {
                public function array(array $array): array
                {
                    return $array;
                }
            }, $absolutePath);

            if (empty($data) || empty($data[0])) {
                Log::warning('Arquivo Excel vazio ou sem dados', ['file_path' => $absolutePath]);
                return;
            }

            $rows = $data[0];
            $processedCount = 0;
            $errorCount = 0;
            $priceColumnKey = null;

            Log::info('Iniciando processamento das linhas', ['total_rows' => count($rows)]);

            // Iterar sobre cada linha do Excel
            foreach ($rows as $index => $row) {
                try {
                    // Converter todas as chaves para minúsculas para ignorar maiúsculas/minúsculas
                    $rowData = array_change_key_case($row, CASE_LOWER);

                    Log::debug('Dados brutos da linha do Excel', [
                        'row_number' => $index + 1,
                        'preco_revendedor_raw' => $rowData['preco_revendedor'] ?? 'NAO ENCONTRADO',
                        'preco_distribuidor_raw' => $rowData['preco_distribuidor'] ?? 'NAO ENCONTRADO',
                        'type_rev' => gettype($rowData['preco_revendedor'] ?? null),
                        'type_dist' => gettype($rowData['preco_distribuidor'] ?? null),
                    ]);

                    // Encontrar a coluna de preços na primeira iteração
                    if ($index === 0 && $priceColumnKey === null) {
                        foreach (array_keys($rowData) as $key) {
                            if (strpos($key, 'precos') !== false || strpos($key, 'price') !== false) {
                                $priceColumnKey = $key;
                                break;
                            }
                        }
                    }

                    // Extrair dados usando chaves em minúsculas
                    $sku = $rowData['sku'] ?? null;

                    // Extrair e parsear o preço a partir da coluna identificada
                    $priceValue = $priceColumnKey ? ($rowData[$priceColumnKey] ?? null) : null;
                    $parsedPrice = $this->parsePrice($priceValue);

                    // Verificar se o SKU é válido
                    if (!$sku || empty(trim($sku))) {
                        Log::error('Linha sem SKU válido', [
                            'row_number' => $index + 1,
                            'row_data' => $rowData
                        ]);
                        $errorCount++;
                        continue;
                    }

                    $sku = trim($sku);

                    // Validar preço ausente ou inválido
                    if ($parsedPrice === null || !is_numeric($parsedPrice)) {
                        Log::error('Linha com preço inválido ou ausente', ['row_number' => $index + 1, 'row_data' => $rowData]);
                        $errorCount++;
                        continue;
                    }

                    // Definir dados a atualizar conforme targetRole
                    if ($this->targetRole === 'revendedor') {
                        $dataToUpdate = ['price_revendedor' => $parsedPrice];
                    } elseif ($this->targetRole === 'distribuidor') {
                        $dataToUpdate = ['price_distribuidor' => $parsedPrice];
                    } else {
                        Log::error('targetRole inválido ao processar linha', ['target_role' => $this->targetRole, 'row_number' => $index + 1]);
                        $errorCount++;
                        continue;
                    }

                    // Usar updateOrCreate no modelo ProductPrice
                    ProductPrice::updateOrCreate(
                        ['product_sku' => $sku],
                        $dataToUpdate
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
                'file_path' => $absolutePath,
                'total_rows' => count($rows),
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
