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
     * Retorna a lista de produtos do WooCommerce (via BD Local) com paginação e filtro de categoria
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
        $search = $request->query('search');

        // 1. Query Local DB (Parents only)
        // Grouped view: We select simple products (no parent) and variable parents.
        // We exclude variations from the top-level list, as they are nested under parents.
        $query = \App\Models\Product::with(['categories', 'variations'])
            ->where('status', 'publish')
            ->where('parent_id', 0);

        // Filters
        if ($categoryId) {
            $query->whereHas('categories', function ($q) use ($categoryId) {
                $q->where('categories.id', $categoryId);
            });
        }
        
        if ($search) {
             $query->where(function($q) use ($search) {
                 $q->where('name', 'like', "%{$search}%")
                   ->orWhere('sku', 'like', "%{$search}%");
             });
        }

        $query->orderBy('created_at', 'desc');
        $paginator = $query->paginate($perPage, ['*'], 'page', $page);
        $products = $paginator->getCollection();

        // 2. Collect all SKUs (Parents + Variations)
        $allSkus = [];
        foreach ($products as $product) {
            if ($product->sku) {
                $allSkus[] = $product->sku;
            }
            if ($product->relationLoaded('variations')) {
                foreach ($product->variations as $variation) {
                    if ($variation->sku) {
                        $allSkus[] = $variation->sku;
                    }
                }
            }
        }
        $allSkus = array_unique($allSkus);

        // 3. Setup Business Model & Stock File Status
        $user = auth()->user();
        if ($user) {
            $user->load('partnerProfile');
        }
        $businessModel = $user->partnerProfile->business_model ?? null;
        $stockFileIsActive = $businessModel
            ? StockFile::where('target_business_model', $businessModel)->where('is_active', true)->exists()
            : false;

        // 4. Anexar Preços
        if ($businessModel && $stockFileIsActive) {
            $localPrices = ProductPrice::whereIn('product_sku', $allSkus)->get()->keyBy('product_sku');
            $discountPercentage = auth()->user()->partnerProfile->discount_percentage ?? 0;

            // Helper closure to apply price logic
            $applyPrice = function ($product) use ($localPrices, $businessModel, $discountPercentage) {
                 if (!$product->sku || !$localPrices->has($product->sku)) {
                     $product->local_price = null;
                     return;
                 }
                 
                 $priceData = $localPrices[$product->sku];
                 $basePrice = match ($businessModel) {
                    'B2C' => $priceData->price_b2c,
                    'B2B' => $priceData->price_b2b,
                    default => null,
                 };

                if ($basePrice !== null) {
                    $product->original_price = (float) $basePrice; 
                    if ($discountPercentage > 0) {
                        $discountAmount = $basePrice * ($discountPercentage / 100);
                        $product->local_price = $basePrice - $discountAmount;
                        $product->discount_percentage = $discountPercentage;
                    } else {
                        $product->local_price = $basePrice;
                        $product->discount_percentage = 0;
                    }
                } else {
                    $product->local_price = null;
                }
            };

            foreach ($products as $product) {
                // Apply to Parent (if it has its own price, though usually it's a container)
                $applyPrice($product);

                // Apply to Variations
                if ($product->relationLoaded('variations')) {
                    foreach ($product->variations as $variation) {
                        $applyPrice($variation);
                    }

                    // If Parent has no price but variations do, assume From/First price
                    if ($product->local_price === null && $product->variations->isNotEmpty()) {
                        // Use the first variation's price as the "default" for the card
                        $firstVar = $product->variations->first();
                        if ($firstVar->local_price !== null) {
                            $product->local_price = $firstVar->local_price;
                            $product->original_price = $firstVar->original_price ?? null;
                            $product->discount_percentage = $firstVar->discount_percentage ?? 0;
                            // Also ensure stock status reflects
                            $product->stock_status = $firstVar->stock_status; 
                        }
                    }
                }
            }
        }

        $paginationData = [
            'total_items' => $paginator->total(),
            'total_pages' => $paginator->lastPage(),
            'current_page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
        ];

        return response()->json([
            'success' => true,
            'data' => ProductResource::collection($products),
            'pagination' => $paginationData,
            'message' => 'Produtos obtidos com sucesso (Local DB)'
        ]);
    }

    /**
     * Retorna a lista de produtos para administradores, incluindo preços B2B e B2C (Via Local DB)
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

        // 1. Query Local DB (Simple + Variations)
        // Grouped view: We select Parents and include variations.
        $query = \App\Models\Product::with(['categories', 'variations'])
            ->where('status', 'publish')
            ->where('parent_id', 0);

        // Filter by Category
        if ($categoryId) {
             $query->whereHas('categories', function ($q) use ($categoryId) {
                 $q->where('categories.id', $categoryId);
             });
        }

        // Filter by Search
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        // Sort
        $query->orderBy('created_at', 'desc');

        // Paginate
        $paginator = $query->paginate($perPage, ['*'], 'page', $page);
        $products = $paginator->getCollection();
        
        // 2. Collect all SKUs (Parents + Variations)
        $allSkus = [];
        foreach ($products as $product) {
            if ($product->sku) {
                $allSkus[] = $product->sku;
            }
            if ($product->relationLoaded('variations')) {
                foreach ($product->variations as $variation) {
                     if ($variation->sku) {
                        $allSkus[] = $variation->sku;
                    }
                }
            }
        }
        $allSkus = array_unique($allSkus);

        // 3. Verificar mapas de stock
        $b2bFileIsActive = StockFile::where('target_business_model', 'B2B')->where('is_active', true)->exists();
        $b2cFileIsActive = StockFile::where('target_business_model', 'B2C')->where('is_active', true)->exists();

        // 4. Buscar preços locais
        $localPrices = empty($allSkus)
            ? collect([])
            : ProductPrice::whereIn('product_sku', $allSkus)->get()->keyBy('product_sku');

        // Helper to attach admin prices
        $attachAdminPrices = function ($product) use ($localPrices, $b2bFileIsActive, $b2cFileIsActive) {
             $priceData = null;
             if ($product->sku && $localPrices->has($product->sku)) {
                 $priceData = $localPrices[$product->sku];
             }

             if ($priceData) {
                 $product->setAttribute('price_b2b', $b2bFileIsActive ? ($priceData->price_b2b ?? null) : null);
                 $product->setAttribute('price_b2c', $b2cFileIsActive ? ($priceData->price_b2c ?? null) : null);
                 $product->setAttribute('stock_quantity', $priceData->stock_quantity ?? null);
             } else {
                 $product->setAttribute('price_b2b', null);
                 $product->setAttribute('price_b2c', null);
                 $product->setAttribute('stock_quantity', null);
             }
        };

        // 5. Anexar preços
        foreach ($products as $product) {
            $attachAdminPrices($product);

            if ($product->relationLoaded('variations')) {
                foreach ($product->variations as $variation) {
                    $attachAdminPrices($variation);
                }
            }
        }

        // Return pagination object directly as it transforms to standard JSON structure
        return response()->json($paginator);
    }
}
