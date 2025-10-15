<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $orders = Order::with('user:id,name')
            ->when($request->query('status'), function ($query, $status) {
                return $query->where('status', $status);
            })
            ->latest()
            ->paginate();

        return response()->json($orders);
    }
}
