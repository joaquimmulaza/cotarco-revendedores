<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\ProductPrice;
use App\Services\WooCommerceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    protected $wooCommerceService;

    public function __construct(WooCommerceService $wooCommerceService)
    {
        $this->wooCommerceService = $wooCommerceService;
    }

    /**
     * Retorna a lista de produtos do WooCommerce com paginação e filtro de categoria
     * Integra preços locais da tabela product_prices baseado no role do usuário
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $categoryId = $request->query('category_id');
        $page = (int) $request->query('page', 1);
        $perPage = (int) $request->query('per_page', 10);

        // 1. Obter produtos do WooCommerce
        $result = $this->wooCommerceService->getProducts($categoryId, $page, $perPage);
        $products = $result['products'];

        // 2. Extrair todos os SKUs dos produtos
        $skus = collect($products)->pluck('sku')->filter()->toArray();

        // 3. Buscar preços locais para todos os SKUs
        $localPrices = ProductPrice::whereIn('product_sku', $skus)->get()->keyBy('product_sku');

        // 4. Obter o role do usuário autenticado
        $userRole = auth()->user()->role;

        // 5. Iterar sobre os produtos e atualizar preços
        foreach ($products as &$product) {
            $sku = $product['sku'] ?? null;
            
            if ($sku && $localPrices->has($sku)) {
                $priceData = $localPrices[$sku];
                
                // Determinar qual coluna de preço usar baseado no role
                if ($userRole === 'revendedor') {
                    $localPrice = $priceData->price_revendedor;
                } elseif ($userRole === 'distribuidor') {
                    $localPrice = $priceData->price_distribuidor;
                } else {
                    $localPrice = null;
                }

                // Substituir o preço do produto
                if ($localPrice !== null) {
                    $product['price'] = (string) $localPrice;
                    $product['price_formatted'] = '€' . number_format($localPrice, 2, ',', '.');
                } else {
                    $product['price'] = null;
                    $product['price_formatted'] = 'Sob consulta';
                }
            } else {
                // Se não houver preço local, definir como "Sob consulta"
                $product['price'] = null;
                $product['price_formatted'] = 'Sob consulta';
            }
        }

        return response()->json([
            'success' => true,
            'data' => ProductResource::collection($products),
            'pagination' => $result['pagination'],
            'message' => 'Produtos obtidos com sucesso'
        ]);
    }
}
