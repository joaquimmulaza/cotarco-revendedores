<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;

class PartnerOrderController extends Controller
{
    public function myOrders(Request $request)
    {
        $user = auth()->user();
        $perPage = $request->query('per_page', 5);

        $orders = Order::where('user_id', $user->id)
            ->with('items')
            ->latest()
            ->paginate($perPage);

        return response()->json($orders);
    }

    public function show($id)
    {
        $user = auth()->user();
        $order = Order::with('items')->findOrFail($id);

        if ($order->user_id !== $user->id) {
            return response()->json(['message' => 'Não autorizado'], 403);
        }

        return response()->json($order);
    }
}
