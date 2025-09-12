<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
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
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $categoryId = $request->query('category_id');
        $page = (int) $request->query('page', 1);
        $perPage = (int) $request->query('per_page', 10);

        $result = $this->wooCommerceService->getProducts($categoryId, $page, $perPage);

        return response()->json([
            'success' => true,
            'data' => ProductResource::collection($result['products']),
            'pagination' => $result['pagination'],
            'message' => 'Produtos obtidos com sucesso'
        ]);
    }
}
