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
                    $rowData = array_change_key_case($row, CASE_LOWER);
                    $sku = $rowData['sku'] ?? null;

                    // Na primeira linha, descobre qual é a coluna de preços
                    if ($priceColumnKey === null) {
                        foreach (array_keys($rowData) as $key) {
                            $lowerKey = function_exists('mb_strtolower') ? mb_strtolower($key) : strtolower($key);
                            $normalizedKey = strtr($lowerKey, [
                                'ç' => 'c', 'é' => 'e', 'ê' => 'e', 'è' => 'e', 'ë' => 'e',
                                'á' => 'a', 'à' => 'a', 'â' => 'a', 'ã' => 'a', 'ä' => 'a',
                                'í' => 'i', 'ì' => 'i', 'î' => 'i', 'ï' => 'i',
                                'ó' => 'o', 'ò' => 'o', 'ô' => 'o', 'õ' => 'o', 'ö' => 'o',
                                'ú' => 'u', 'ù' => 'u', 'û' => 'u', 'ü' => 'u'
                            ]);
                            if (strpos($normalizedKey, 'preco') !== false || strpos($normalizedKey, 'price') !== false) {
                                $priceColumnKey = $key;
                                break;
                            }
                        }
                        if ($priceColumnKey === null) {
                            Log::error('Coluna de preço não encontrada na linha', ['row_number' => $index + 1, 'headers' => array_keys($rowData)]);
                            $errorCount++;
                            continue;
                        }
                    }

                    // Extrai e limpa o valor do preço
                    $priceValue = $priceColumnKey ? ($rowData[$priceColumnKey] ?? null) : null;
                    $parsedPrice = $this->parsePrice($priceValue);

                    // Validações
                    if (empty(trim($sku))) {
                        Log::error('Linha sem SKU válido', ['row_number' => $index + 1, 'data' => $rowData]);
                        $errorCount++;
                        continue;
                    }

                    if (!is_numeric($parsedPrice)) {
                        Log::error('Preço inválido ou não encontrado para o SKU', [
                            'row_number' => $index + 1,
                            'sku' => $sku,
                            'price_key' => $priceColumnKey,
                            'price_value' => $priceValue
                        ]);
                        $errorCount++;
                        continue;
                    }

                    // Prepara os dados para o update com base no target_role
                    $dataToUpdate = [];
                    if ($this->targetRole === 'revendedor') {
                        $dataToUpdate['price_revendedor'] = $parsedPrice;
                    } elseif ($this->targetRole === 'distribuidor') {
                        $dataToUpdate['price_distribuidor'] = $parsedPrice;
                    } else {
                        Log::error('Target Role inválido', ['role' => $this->targetRole]);
                        $errorCount++;
                        continue;
                    }

                    // Atualiza ou cria o registo
                    ProductPrice::updateOrCreate(
                        ['product_sku' => trim($sku)],
                        $dataToUpdate
                    );

                    $processedCount++;

                } catch (\Exception $e) {
                    Log::error('Erro inesperado ao processar linha', [
                        'row_number' => $index + 1,
                        'error' => $e->getMessage(),
                        'data' => $row
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
