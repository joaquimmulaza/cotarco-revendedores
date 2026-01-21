<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WooCommerceService
{
    protected $storeUrl;
    protected $consumerKey;
    protected $consumerSecret;

    public function __construct()
    {
        $this->storeUrl = config('services.woocommerce.store_url');
        $this->consumerKey = config('services.woocommerce.consumer_key');
        $this->consumerSecret = config('services.woocommerce.consumer_secret');
    }

    /**
     * Busca categorias ativas do WooCommerce
     *
     * @return array
     */
    public function getActiveCategories()
    {
        try {
            $response = Http::withBasicAuth($this->consumerKey, $this->consumerSecret)
                ->get($this->storeUrl . '/wp-json/wc/v3/products/categories', [
                    'hide_empty' => true,
                    'per_page' => 100,
                    'parent' => 0
                ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Erro ao buscar categorias do WooCommerce', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            return [];

        } catch (\Exception $e) {
            Log::error('Exceção ao buscar categorias do WooCommerce', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return [];
        }
    }

    /**
     * Busca produtos do WooCommerce com paginação e filtro de categoria
     *
     * @param int|null $categoryId
     * @param int $page
     * @param int $perPage
     * @return array
     */
    public function getProducts(int $categoryId = null, int $page = 1, int $perPage = 10, $search = null)
    {
        try {
            $baseParams = [
                'page' => $page,
                'per_page' => $perPage,
                'status' => 'publish'
            ];

            if ($categoryId !== null) {
                $baseParams['category'] = $categoryId;
            }

            $http = Http::withBasicAuth($this->consumerKey, $this->consumerSecret);

            $productsCombined = [];
            $seenProductIds = [];
            $totalItemsHeader = 0;
            $totalPagesHeader = 0;

            // 1) Pesquisa por nome/descrição (search)
            $paramsSearch = $baseParams;
            if ($search !== null && trim((string) $search) !== '') {
                $paramsSearch['search'] = $search;
            }
            $responseSearch = $http->get($this->storeUrl . '/wp-json/wc/v3/products', $paramsSearch);
            if ($responseSearch->successful()) {
                $productsSearch = $responseSearch->json();
                $totalItemsHeader = (int) ($responseSearch->header('X-WP-Total') ?? 0);
                $totalPagesHeader = (int) ($responseSearch->header('X-WP-TotalPages') ?? 0);
                foreach ($productsSearch as $product) {
                    $productsCombined[] = $product;
                    $seenProductIds[$product['id']] = true;
                }
            }

            // 2) Pesquisa adicional por SKU exato (quando há termo de pesquisa)
            if ($search !== null && trim((string) $search) !== '') {
                $paramsSku = $baseParams;
                // Para SKU, forçamos primeira página e um per_page maior para garantir captura
                $paramsSku['page'] = 1;
                $paramsSku['per_page'] = max(100, (int) $perPage);
                $paramsSku['sku'] = trim((string) $search); // WooCommerce aceita filtro por SKU exato
                $responseSku = $http->get($this->storeUrl . '/wp-json/wc/v3/products', $paramsSku);
                if ($responseSku->successful()) {
                    $productsSku = $responseSku->json();
                    foreach ($productsSku as $product) {
                        if (!isset($seenProductIds[$product['id']])) {
                            $productsCombined[] = $product;
                            $seenProductIds[$product['id']] = true;
                        }
                    }
                }
            }

            // Se não houve nenhuma resposta bem-sucedida, tenta uma chamada simples sem search
            if (empty($productsCombined)) {
                $response = $http->get($this->storeUrl . '/wp-json/wc/v3/products', $baseParams);
                if ($response->successful()) {
                    $productsCombined = $response->json();
                    $totalItemsHeader = (int) ($response->header('X-WP-Total') ?? 0);
                    $totalPagesHeader = (int) ($response->header('X-WP-TotalPages') ?? 0);
                } else {
                    Log::error('Erro ao buscar produtos do WooCommerce', [
                        'status' => $response->status(),
                        'body' => $response->body(),
                        'params' => $baseParams
                    ]);
                }
            }

            // Inicializar array para produtos expandidos (variantes)
            $flattenedProducts = [];
            foreach ($productsCombined as &$product) { // Adicionado '&' para modificar o array original
                // Adiciona a URL da descrição personalizada
                $product['custom_description_url'] = $this->fetchCustomDescription($product);

                if (isset($product['type']) && $product['type'] === 'variable') {
                    $variations = $this->getProductVariations($product['id']);
                    foreach ($variations as $variation) {
                        $flattenedProducts[] = $this->createVariationProduct($product, $variation);
                    }
                } else {
                    $flattenedProducts[] = $product;
                }
            }
            unset($product); // Boa prática para remover a referência

            // Ajustar paginação: quando há search, combinamos resultados (nome + SKU)
            $totalItems = $totalItemsHeader > 0 ? $totalItemsHeader : count($flattenedProducts);
            $totalPages = $totalPagesHeader > 0 ? $totalPagesHeader : (int) ceil($totalItems / max(1, $perPage));

            return [
                'products' => $flattenedProducts,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $perPage,
                    'total_items' => (int) $totalItems,
                    'total_pages' => (int) $totalPages,
                    'has_next_page' => $page < (int) $totalPages,
                    'has_prev_page' => $page > 1
                ]
            ];

            Log::error('Erro ao buscar produtos do WooCommerce', [
                'status' => $response->status(),
                'body' => $response->body(),
                'params' => $params
            ]);

            return [
                'products' => [],
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $perPage,
                    'total_items' => 0,
                    'total_pages' => 0,
                    'has_next_page' => false,
                    'has_prev_page' => false
                ]
            ];

        } catch (\Exception $e) {
            Log::error('Exceção ao buscar produtos do WooCommerce', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'params' => $params ?? []
            ]);

            return [
                'products' => [],
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $perPage,
                    'total_items' => 0,
                    'total_pages' => 0,
                    'has_next_page' => false,
                    'has_prev_page' => false
                ]
            ];
        }
    }

    /**
     * Busca as variações de um produto variável
     *
     * @param int $productId
     * @return array
     */
    private function getProductVariations(int $productId): array
    {
        try {
            $response = Http::withBasicAuth($this->consumerKey, $this->consumerSecret)
                ->get($this->storeUrl . "/wp-json/wc/v3/products/{$productId}/variations");

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Erro ao buscar variações do produto', [
                'product_id' => $productId,
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            return [];

        } catch (\Exception $e) {
            Log::error('Exceção ao buscar variações do produto', [
                'product_id' => $productId,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return [];
        }
    }

    /**
     * Cria um produto completo a partir de uma variação
     *
     * @param array $parentProduct
     * @param array $variation
     * @return array
     */
    private function createVariationProduct(array $parentProduct, array $variation): array
    {
        // Construir nome da variação
        $variationName = $this->buildVariationName($parentProduct['name'], $variation);

        // Determinar imagem (variação ou pai)
        $image = $this->getVariationImage($variation, $parentProduct);

        return [
            'id' => $variation['id'],
            'name' => $variationName,
            // Herdar SKU do pai quando a variação não tem SKU definido
            'sku' => ($variation['sku'] ?? null) ?: ($parentProduct['sku'] ?? null),
            'regular_price' => $variation['regular_price'] ?? $parentProduct['regular_price'],
            'stock_status' => $variation['stock_status'] ?? $parentProduct['stock_status'],
            'images' => $image ? [$image] : ($parentProduct['images'] ?? []),
            'image' => $image, // Adicionar imagem individual da variação
            'type' => 'variation',
            'parent_id' => $parentProduct['id'],
            'custom_description_url' => $parentProduct['custom_description_url'] ?? null
        ];
    }

    /**
     * Constrói o nome da variação combinando nome do pai com atributos
     *
     * @param string $parentName
     * @param array $variation
     * @return string
     */
    private function buildVariationName(string $parentName, array $variation): string
    {
        $attributes = [];
        
        if (isset($variation['attributes']) && is_array($variation['attributes'])) {
            foreach ($variation['attributes'] as $attribute) {
                if (isset($attribute['name']) && isset($attribute['option'])) {
                    $attributes[] = $attribute['name'] . ': ' . $attribute['option'];
                }
            }
        }

        if (empty($attributes)) {
            return $parentName;
        }

        return $parentName . ' - ' . implode(', ', $attributes);
    }

    /**
     * Obtém a imagem da variação ou retorna null
     *
     * @param array $variation
     * @param array $parentProduct
     * @return array|null
     */
    private function getVariationImage(array $variation, array $parentProduct): ?array
    {
        // Verificar se a variação tem imagem
        if (isset($variation['image']) && is_array($variation['image']) && !empty($variation['image']['src'])) {
            return $variation['image'];
        }

        // Verificar se a variação tem imagens no array
        if (isset($variation['images']) && is_array($variation['images']) && !empty($variation['images'])) {
            return $variation['images'][0];
        }

        // Retornar null para usar imagem do pai
        return null;
    }

    /**
     * Extrai a URL do iframe a partir dos metadados do produto.
     *
     * @param array $productData Os dados do produto do WooCommerce.
     * @return string|null A URL do iframe ou null se não houver.
     */
    private function fetchCustomDescription(array $productData): ?string
    {
        // Encontra a URL do iframe nos metadados
        $iframeUrl = null;
        if (isset($productData['meta_data'])) {
            foreach ($productData['meta_data'] as $meta) {
                // 1. Procurar pela chave correta
                if ($meta['key'] === '_wpcode_footer_scripts') {
                    // 2. Verificar se o valor é um array e se a sub-chave 'any' existe
                    if (is_array($meta['value']) && !empty($meta['value']['any']) && is_string($meta['value']['any'])) {
                        $htmlContent = $meta['value']['any'];
                        // 3. Extrair a URL do src do iframe a partir do conteúdo HTML
                        if (preg_match('/<iframe[^>]+src="([^"]+)"/i', $htmlContent, $matches)) {
                            $iframeUrl = $matches[1];
                            break; // Encontrou, pode sair do loop
                        }
                    }
                }
            }
        }

        if (!$iframeUrl) {
            return null;
        }

        // Agora retornamos diretamente a URL do iframe
        return $iframeUrl;
    }
    /**
     * Sync categories from WooCommerce to local database
     */
    public function syncCategories()
    {
        Log::info('Iniciando sincronização de categorias...');
        $categories = $this->getActiveCategories();
        
        $count = 0;
        foreach ($categories as $catData) {
            \App\Models\Category::updateOrCreate(
                ['id' => $catData['id']],
                [
                    'name' => $catData['name'],
                    'slug' => $catData['slug'],
                    'parent' => $catData['parent'],
                    'image' => $catData['image'],
                    'menu_order' => $catData['menu_order'],
                    'count' => $catData['count']
                ]
            );
            $count++;
        }
        
        Log::info("Sincronização de categorias concluída. $count categorias processadas.");
        return $count;
    }

    /**
     * Sync all products from WooCommerce to local database
     */
    public function syncProducts()
    {
        Log::info('Iniciando sincronização de produtos...');
        
        $page = 1;
        $perPage = 50; // Fetch in larger chunks for sync
        $totalProcessed = 0;
        
        do {
            // Fetch raw data from existing logic, but force 'active' status loop internally handled by getProducts
            // Actually, getProducts logic is complex (merging variable + sku search).
            // For SYNC, we want simple iteration over ALL products.
            // We'll write a dedicated loop here to avoid the complexity of 'getProducts' which does display logic.
            
            $response = Http::withBasicAuth($this->consumerKey, $this->consumerSecret)
                ->get($this->storeUrl . '/wp-json/wc/v3/products', [
                    'page' => $page,
                    'per_page' => $perPage,
                    'status' => 'publish'
                ]);

            if (!$response->successful()) {
                Log::error('Erro ao buscar página de produtos para sync', ['page' => $page, 'status' => $response->status()]);
                break;
            }

            $products = $response->json();
            if (empty($products)) {
                break; // No more products
            }

            foreach ($products as $productData) {
                $this->upsertProduct($productData);
                $totalProcessed++;

                // If variable, we must fetch variations too?
                // The current getProducts fetches variations eagerly.
                // It is better if we fetch variations here too to have a complete database.
                if (isset($productData['type']) && $productData['type'] === 'variable') {
                    $variations = $this->getProductVariations($productData['id']);
                    foreach ($variations as $variation) {
                        // Transform variation to look like a product for unification, 
                        // OR save it as a product with parent_id.
                        // Our Product model supports parent_id.
                        $variationProductData = $this->prepareVariationData($productData, $variation);
                        $this->upsertProduct($variationProductData);
                    }
                }
            }
            
            $page++;
            // Safety break
            if ($page > 100) break;
            
        } while (count($products) > 0);

        Log::info("Sincronização de produtos concluída. $totalProcessed produtos principais processados.");
        return $totalProcessed;
    }

    /**
     * Helper to upsert a signle product/variation
     */
    private function upsertProduct(array $data)
    {
        // Extract Custom Description URL if present
        $customDescUrl = $this->fetchCustomDescription($data);
        
        $mappedData = [
            'name' => $data['name'],
            'slug' => $data['slug'],
            'permalink' => $data['permalink'],
            'type' => $data['type'],
            'status' => $data['status'],
            'sku' => $data['sku'] ?? null,
            'price' => $data['price'],
            'regular_price' => $data['regular_price'],
            'sale_price' => $data['sale_price'],
            'stock_status' => $data['stock_status'],
            'images' => $data['images'] ?? [],
            'description' => $data['description'],
            'short_description' => $data['short_description'],
            'custom_description_url' => $customDescUrl,
            'attributes' => $data['attributes'] ?? [], // Add attributes sync
            'parent_id' => $data['parent_id'] ?? 0,
        ];

        // Upsert do produto
        $product = \App\Models\Product::updateOrCreate(
            ['id' => $data['id']],
            $mappedData
        );

        // Sync Categories
        if (isset($data['categories']) && is_array($data['categories'])) {
            $categoryIds = array_column($data['categories'], 'id');
            // Sync categories. We assume categories have been synced prior to products.
            $product->categories()->sync($categoryIds);
        }

        return $product;
    }

    /**
     * Prepare variation data to match product structure for saving
     */
    private function prepareVariationData(array $parent, array $variation): array
    {
        // Build name (similar to createVariationProduct but purely data)
        $variationName = $this->buildVariationName($parent['name'], $variation);
        
        return [
            'id' => $variation['id'],
            'name' => $variationName,
            'slug' => $parent['slug'] . '-v-' . $variation['id'], // synthetic slug
            'permalink' => $variation['permalink'],
            'type' => 'variation',
            'status' => $variation['status'],
            'sku' => ($variation['sku'] ?? null) ?: ($parent['sku'] ?? null),
            'price' => $variation['price'],
            'regular_price' => $variation['regular_price'],
            'sale_price' => $variation['sale_price'],
            'stock_status' => $variation['stock_status'] ?? $parent['stock_status'],
            'images' => !empty($variation['image']) ? [$variation['image']] : ($parent['images'] ?? []),
            'description' => $variation['description'],
            'short_description' => '',
            'parent_id' => $parent['id'],
            // Variations might inherit custom desc? usually no, but we can check if needed.
            // For now, let's say no, or inherit parent's meta if we want.
            // But fetchCustomDescription works on meta_data, so we pass variation data.
            'meta_data' => $variation['meta_data'] ?? [],
            'attributes' => $variation['attributes'] ?? [], // Add attributes sync for variations
        ];
    }
}
