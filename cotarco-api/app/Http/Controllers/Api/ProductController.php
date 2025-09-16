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

        // 5. Iterar sobre os produtos e adicionar preços locais
        foreach ($products as &$product) {
            $sku = $product['sku'] ?? null;
            
            if ($sku && $localPrices->has($sku)) {
                $priceData = $localPrices[$sku];
                
                // Determinar qual coluna de preço usar baseado no role
                if ($userRole === 'revendedor') {
                    $product['local_price'] = $priceData->price_revendedor;
                } elseif ($userRole === 'distribuidor') {
                    $product['local_price'] = $priceData->price_distribuidor;
                } else {
                    $product['local_price'] = null;
                }
            } else {
                // Se não houver preço local, definir como null
                $product['local_price'] = null;
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
