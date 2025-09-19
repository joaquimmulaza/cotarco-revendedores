<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\ProductPrice;
use App\Models\StockFile;
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

        // 4. Obter o business model do utilizador autenticado (via partnerProfile)
        $businessModel = auth()->user()->partnerProfile->business_model ?? null;

        // 5. Verificar se existe mapa de stock ativo para este business model
        $stockFileIsActive = $businessModel
            ? StockFile::where('target_business_model', $businessModel)->where('is_active', true)->exists()
            : false;

        // 6. Apenas anexar preços locais se houver mapa ativo para o business model
        if ($businessModel && $stockFileIsActive) {
            $localPrices = ProductPrice::whereIn('product_sku', $allSkus)->get()->keyBy('product_sku');

            foreach ($products as &$product) {
                $sku = $product['sku'] ?? null;
                if ($sku && $localPrices->has($sku)) {
                    $priceData = $localPrices[$sku];
                    $product['local_price'] = match ($businessModel) {
                        'B2C' => $priceData->price_b2c,
                        'B2B' => $priceData->price_b2b,
                        default => null,
                    };
                }
            }
            unset($product);
        }

        return response()->json([
            'success' => true,
            'data' => ProductResource::collection($products),
            'pagination' => $result['pagination'],
            'message' => 'Produtos obtidos com sucesso'
        ]);
    }
}
