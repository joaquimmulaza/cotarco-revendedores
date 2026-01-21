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
     * Retorna a lista de categorias ativas do WooCommerce (via BD local)
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        // Buscar do banco de dados local
        // Ordenar por menu_order se desejar manter a ordem do WC
        $categories = \App\Models\Category::orderBy('menu_order', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
            'message' => 'Categorias obtidas com sucesso (Local DB)'
        ]);
    }
}
