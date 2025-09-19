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

        // 1. Obter produtos do WooCommerce (já processados com variações separadas)
        $result = $this->wooCommerceService->getProducts($categoryId, $page, $perPage);
        $products = $result['products'];

        // 2. Criar array para guardar todos os SKUs
        $allSkus = [];

        // 3. Percorrer a lista de produtos para recolher todos os SKUs
        foreach ($products as $product) {
            if (isset($product['sku']) && !empty($product['sku'])) {
                $allSkus[] = $product['sku'];
            }
        }

        // 4. Buscar preços locais para todos os SKUs
        $localPrices = ProductPrice::whereIn('product_sku', $allSkus)->get()->keyBy('product_sku');

        // 5. Obter o business model do utilizador autenticado (via partnerProfile)
        $businessModel = auth()->user()->partnerProfile->business_model ?? null;

        // 6. Percorrer novamente a lista de produtos e anexar preços locais
        foreach ($products as &$product) {
            $sku = $product['sku'] ?? null;
            
            if ($sku && $localPrices->has($sku)) {
                $priceData = $localPrices[$sku];
                
                // Determinar qual coluna de preço usar baseado no business_model
                $product['local_price'] = match ($businessModel) {
                    'B2C' => $priceData->price_b2c,
                    'B2B' => $priceData->price_b2b,
                    default => null,
                };
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
