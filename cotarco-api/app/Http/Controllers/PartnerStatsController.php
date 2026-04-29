<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Order;

class PartnerStatsController extends Controller
{
    public function stats()
    {
        $user = auth()->user();
        $userId = $user->id;

        // Encomendas do mês actual
        $ordersThisMonth = Order::where('user_id', $userId)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year);

        // Total gasto este mês (apenas pagas)
        $spentThisMonth = (clone $ordersThisMonth)
            ->whereIn('status', ['paid', 'success', 'completed'])
            ->sum('total_amount');

        // Total gasto mês anterior (para calcular delta)
        $spentLastMonth = Order::where('user_id', $userId)
            ->whereMonth('created_at', now()->subMonth()->month)
            ->whereYear('created_at', now()->subMonth()->year)
            ->whereIn('status', ['paid', 'success', 'completed'])
            ->sum('total_amount');

        // Contagem de encomendas por estado (este mês)
        $orderCounts = Order::where('user_id', $userId)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->selectRaw("status, COUNT(*) as count")
            ->groupBy('status')
            ->pluck('count', 'status');

        // Total de encomendas históricas
        $totalOrders = Order::where('user_id', $userId)->count();

        // Gastos mensais dos últimos 6 meses (para o gráfico)
        $monthlySpending = Order::where('user_id', $userId)
            ->whereIn('status', ['paid', 'success', 'completed'])
            ->where('created_at', '>=', now()->subMonths(6)->startOfMonth())
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month,
                         SUM(total_amount) as total,
                         COUNT(*) as order_count")
            ->groupBy('month')
            ->orderBy('month', 'asc')
            ->get();

        // Categorias mais compradas (top 5)
        $topCategories = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.sku', '=', 'order_items.product_sku')
            ->join('category_product', 'category_product.product_id', '=', 'products.id')
            ->join('categories', 'categories.id', '=', 'category_product.category_id')
            ->where('orders.user_id', $userId)
            ->whereIn('orders.status', ['paid', 'success', 'completed'])
            ->where('categories.parent', 0)
            ->selectRaw('categories.name, SUM(order_items.quantity) as total_qty')
            ->groupBy('categories.name')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get();

        // Referência de pagamento activa
        $activePayment = Order::where('user_id', $userId)
            ->where('status', 'pending')
            ->whereNotNull('shipping_details')
            ->latest()
            ->first();

        $paymentReference = null;
        if ($activePayment && isset($activePayment->shipping_details)) {
            $shippingDetails = is_string($activePayment->shipping_details) 
                ? json_decode($activePayment->shipping_details, true) 
                : $activePayment->shipping_details;
                
            if (isset($shippingDetails['payment_reference'])) {
                $ref = $shippingDetails['payment_reference'];
                $paymentReference = [
                    'order_id'         => $activePayment->id,
                    'entity'           => $ref['entity'] ?? null,
                    'reference_number' => $ref['referenceNumber'] ?? null,
                    'amount'           => $activePayment->total_amount,
                    'due_date'         => $ref['dueDate'] ?? null,
                ];
            }
        }

        return response()->json([
            'data' => [
                'spent_this_month'  => (float) $spentThisMonth,
                'spent_last_month'  => (float) $spentLastMonth,
                'delta_percentage'  => $spentLastMonth > 0
                    ? round((($spentThisMonth - $spentLastMonth) / $spentLastMonth) * 100, 1)
                    : null,
                'orders_this_month' => [
                    'paid'    => (int) ($orderCounts['paid']      ?? 0)
                               + (int) ($orderCounts['success']   ?? 0)
                               + (int) ($orderCounts['completed'] ?? 0),
                    'pending' => (int) ($orderCounts['pending']   ?? 0),
                    'failed'  => (int) ($orderCounts['failed']    ?? 0),
                    'total'   => $ordersThisMonth->count(),
                ],
                'total_orders_historic' => $totalOrders,
                'monthly_spending'      => $monthlySpending,
                'top_categories'        => $topCategories,
                'active_payment'        => $paymentReference,
                'discount_percentage'   => (float) ($user->partnerProfile->discount_percentage ?? 0),
                'business_model'        => $user->partnerProfile->business_model ?? null,
            ]
        ], 200);
    }
}
