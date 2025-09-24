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

            error('Erro ao buscar categorias do WooCommerce', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            return [];

        } catch (\Exception $e) {
            error('Exceção ao buscar categorias do WooCommerce', [
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
            foreach ($productsCombined as $product) {
                if (isset($product['type']) && $product['type'] === 'variable') {
                    $variations = $this->getProductVariations($product['id']);
                    foreach ($variations as $variation) {
                        $flattenedProducts[] = $this->createVariationProduct($product, $variation);
                    }
                } else {
                    $flattenedProducts[] = $product;
                }
            }

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
            'parent_id' => $parentProduct['id']
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
}
