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
                    'per_page' => 100
                ]);

            if ($response->successful()) {
                Log::info('Resposta da API WooCommerce (Categorias):', [
                    'status' => $response->status(),
                    'body' => $response->json()
                ]);
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
    public function getProducts(int $categoryId = null, int $page = 1, int $perPage = 12)
    {
        try {
            $params = [
                'page' => $page,
                'per_page' => $perPage,
                'status' => 'publish'
            ];

            if ($categoryId !== null) {
                $params['category'] = $categoryId;
            }

            $response = Http::withBasicAuth($this->consumerKey, $this->consumerSecret)
                ->get($this->storeUrl . '/wp-json/wc/v3/products', $params);

            if ($response->successful()) {
                $products = $response->json();
                $totalItems = $response->header('X-WP-Total');
                $totalPages = $response->header('X-WP-TotalPages');

                return [
                    'products' => $products,
                    'pagination' => [
                        'current_page' => $page,
                        'per_page' => $perPage,
                        'total_items' => (int) $totalItems,
                        'total_pages' => (int) $totalPages,
                        'has_next_page' => $page < (int) $totalPages,
                        'has_prev_page' => $page > 1
                    ]
                ];
            }

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
}
