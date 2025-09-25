<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\WooCommerceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class CategoryController extends Controller
{
    protected $wooCommerceService;

    public function __construct(WooCommerceService $wooCommerceService)
    {
        $this->wooCommerceService = $wooCommerceService;
    }

    /**
     * Retorna a lista de categorias ativas do WooCommerce
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        $categories = Cache::remember('product_categories', now()->addMinutes(60), function () {
            return $this->wooCommerceService->getActiveCategories();
        });

        return response()->json([
            'success' => true,
            'data' => $categories,
            'message' => 'Categorias obtidas com sucesso'
        ]);
    }
}
