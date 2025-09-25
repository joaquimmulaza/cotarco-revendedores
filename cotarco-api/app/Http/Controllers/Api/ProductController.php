<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\ProductPrice;
use App\Models\StockFile;
use App\Services\WooCommerceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;

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

    /**
     * Retorna a lista de produtos para administradores, incluindo preços B2B e B2C
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function indexForAdmin(Request $request): JsonResponse
    {
        $categoryId = $request->query('category_id');
        $search = $request->query('search');
        $page = (int) $request->query('page', 1);
        $perPage = (int) $request->query('per_page', 10);

        $cacheKey = sprintf(
            'products_admin_page_%d_per_%d_cat_%s_search_%s',
            $page,
            $perPage,
            $categoryId !== null ? (string) $categoryId : 'all',
            ($search !== null && $search !== '') ? (string) $search : 'all'
        );

        $paginatedProducts = Cache::remember($cacheKey, now()->addMinutes(15), function () use ($categoryId, $page, $perPage, $request, $search) {
            // 1. Obter produtos do WooCommerce (já processados com variações separadas)
            $result = $this->wooCommerceService->getProducts($categoryId, $page, $perPage, $search);
            $products = $result['products'];

            // 2. Recolher todos os SKUs não vazios
            $allSkus = [];
            foreach ($products as $product) {
                if (isset($product['sku']) && !empty($product['sku'])) {
                    $allSkus[] = $product['sku'];
                }
            }

            // 3. Buscar preços locais para os SKUs
            $localPrices = empty($allSkus)
                ? collect([])
                : ProductPrice::whereIn('product_sku', $allSkus)->get()->keyBy('product_sku');

            // 4. Anexar ambos os preços e o stock para cada produto
            foreach ($products as &$product) {
                $sku = $product['sku'] ?? null;
                if ($sku && $localPrices->has($sku)) {
                    $priceData = $localPrices[$sku];
                    $product['price_b2b'] = $priceData->price_b2b ?? null;
                    $product['price_b2c'] = $priceData->price_b2c ?? null;
                    $product['stock_quantity'] = $priceData->stock_quantity ?? null;
                } else {
                    $product['price_b2b'] = null;
                    $product['price_b2c'] = null;
                    $product['stock_quantity'] = null;
                }
            }
            unset($product);

            $totalItems = (int)($result['pagination']['total_items'] ?? count($products));
            $paginated = new LengthAwarePaginator(
                $products,
                $totalItems,
                $perPage,
                $page,
                [
                    'path' => $request->url(),
                    'query' => $request->query(),
                ]
            );

            return $paginated;
        });

        return response()->json($paginatedProducts);
    }
}
