<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\PartnerProfile;
use Illuminate\Support\Facades\Hash;
use App\Models\Product;
use App\Models\ProductPrice;
use App\Models\Category;
use App\Models\StockFile;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Concerns\ToArray;

class AdminE2ETestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Limpar dados de teste anteriores
        $testEmails = [
            'approve@example.com', 
            'reject@example.com', 
            'deactivate@example.com', 
            'edit@example.com'
        ];
        
        User::whereIn('email', $testEmails)->delete();

        // 1. For Approve Action
        $this->createPartner('Approve Test Partner', 'approve@example.com', 'pending_approval');
        
        // 2. For Reject Action
        $this->createPartner('Reject Test Partner', 'reject@example.com', 'pending_approval');
        
        // 3. For Deactivate Action
        $this->createPartner('Deactivate Test Partner', 'deactivate@example.com', 'active');
        
        // 4. For Edit Action
        $this->createPartner('Edit Test Partner', 'edit@example.com', 'active');

        // 5. Seed a Stock File for B2B (used by the partner test)
        $this->seedStockFile('B2B');

        // 6. Seed Products from the Excel file to allow price imports
        $this->seedProductsFromExcel();
    }

    private function seedStockFile($businessModel)
    {
        $filePath = 'stock_files/e2e_test_seed.xlsx';
        $fullPath = storage_path('app/private/' . $filePath);

        // Ensure directory exists
        if (!file_exists(dirname($fullPath))) {
            mkdir(dirname($fullPath), 0755, true);
        }

        // Copy an existing valid file if available, otherwise dummy
        $source = 'C:\\cotarco-revendedores\\Cotarco - Tabela de Stocks.xlsx';
        if (file_exists($source)) {
            copy($source, $fullPath);
        } else {
            file_put_contents($fullPath, 'Dummy Excel Content for Seeding');
        }

        \App\Models\StockFile::updateOrCreate(
            ['target_business_model' => $businessModel],
            [
                'display_name' => 'E2E Seeded Stock Map',
                'file_path' => $filePath,
                'original_filename' => 'seeded_stock.xlsx',
                'mime_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'size' => filesize($fullPath),
                'is_active' => true,
                'uploaded_by_user_id' => User::where('role', 'admin')->first()->id ?? 1,
            ]
        );
    }

    private function seedProductsFromExcel()
    {
        $source = 'C:\\cotarco-revendedores\\Cotarco - Tabela de Stocks.xlsx';
        if (!file_exists($source)) {
            return;
        }

        try {
            // Importar dados do Excel
            $data = Excel::toArray(new class implements ToArray {
                public function array(array $array): array
                {
                    return $array;
                }
            }, $source);

            if (empty($data) || empty($data[0])) {
                return;
            }

            $sheetData = $data[0];
            $skuColumnIndex = -1;
            $priceColumnIndex = -1;
            $headerRowIndex = -1;

            // 1. Encontrar a linha do cabeçalho (igual à lógica do ProcessStockFileJob)
            foreach (array_slice($sheetData, 0, 20) as $rowIndex => $row) {
                $normalizedRow = array_map('strtolower', array_filter($row));
                foreach ($normalizedRow as $cellIndex => $cellValue) {
                    if (str_contains($cellValue, 'referencia') || str_contains($cellValue, 'sku')) {
                        $skuColumnIndex = $cellIndex;
                    }
                    if (str_contains($cellValue, 'preço') || str_contains($cellValue, 'preco')) {
                        $priceColumnIndex = $cellIndex;
                    }
                    
                    if ($skuColumnIndex !== -1 && $priceColumnIndex !== -1) {
                        $headerRowIndex = $rowIndex;
                        break 2;
                    }
                }
            }

            if ($headerRowIndex === -1) {
                // Fallback to row 7 (index) if detection fails
                $headerRowIndex = 7;
                $skuColumnIndex = 0;
                $priceColumnIndex = 4;
            }

            // Pegar a primeira categoria disponível para associar aos produtos
            $category = Category::first();

            // 2. Extrair SKUs a partir da Linha 9 (índice 8)
            $headerRowIndex = 7; // Linha 8
            $dataRows = array_slice($sheetData, $headerRowIndex + 1, 30);
            foreach ($dataRows as $rowIndex => $row) {
                $sku = trim((string)($row[$skuColumnIndex] ?? ''));
                $name = trim((string)($row[1] ?? ''));
                $priceRaw = $row[$priceColumnIndex] ?? null;
                $priceValue = $this->parsePrice($priceRaw);
                
                if ($sku && !empty($sku) && !str_contains(strtolower($sku), 'referencia')) {
                    $product = Product::where('sku', $sku)->first();
                    $id = $product ? $product->id : (2000000 + $rowIndex);
                    $slug = \Illuminate\Support\Str::slug($name ?: $sku);
                    
                    $product = Product::updateOrCreate(
                        ['sku' => $sku],
                        [
                            'id' => $id,
                            'name' => $name ?: ('E2E Test Product: ' . $sku),
                            'slug' => $slug,
                            'permalink' => '/' . $slug,
                            'status' => 'publish',
                            'parent_id' => 0
                        ]
                    );

                    // Associar à categoria correta
                    $assignedCategory = null;
                    $loweredName = strtolower($name);
                    
                    if (str_contains($loweredName, 'frigorífico') || 
                        str_contains($loweredName, 'máquina de lavar') || 
                        str_contains($loweredName, 'secadora') || 
                        str_contains($loweredName, 'combinado')) {
                        $assignedCategory = \App\Models\Category::where('name', 'like', '%Eletrodom%')->first();
                    }

                    // Fallback para a primeira categoria se não encontrou uma específica
                    $assignedCategory = $assignedCategory ?: $category;

                    if ($assignedCategory) {
                        $product->categories()->syncWithoutDetaching([$assignedCategory->id]);
                    }

                    // Criar preço B2B para que o carrinho funcione nos testes
                    if ($priceValue !== null) {
                        ProductPrice::updateOrCreate(
                            ['product_sku' => $sku],
                            [
                                'price_b2b' => $priceValue,
                                'stock_quantity' => 10,
                            ]
                        );
                    }
                }
            }
            \Illuminate\Support\Facades\Log::info("Seeding complete. Total products: " . Product::count());
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Erro ao semear produtos do Excel: ' . $e->getMessage());
        }
    }

    private function parsePrice($priceString)
    {
        if ($priceString === null || trim((string)$priceString) === '') {
            return null;
        }
        $cleanedString = str_replace(',', '', (string)$priceString);
        if (is_numeric($cleanedString)) {
            return (float) $cleanedString;
        }
        return null;
    }

    private function createPartner($name, $email, $status)
    {
        // updateOrCreate prevents duplicate-key errors when the seeder is run
        // without a preceding migrate:fresh (e.g. during local debugging).
        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name'               => $name,
                'password'           => Hash::make('password123'),
                // 'distribuidor' matches what RegisterPartnerAction and
                // SeedPartnerController assign, keeping test data consistent.
                'role'               => 'distribuidor',
                'status'             => $status,
                'email_verified_at'  => now(),
            ]
        );

        PartnerProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'company_name'        => $name . ' Ltd',
                'phone_number'        => '+351912345678',
                'alvara_path'         => 'alvaras/dummy.pdf',
                'business_model'      => 'B2B',
                'discount_percentage' => 10.00,
            ]
        );

        return $user;
    }
}
