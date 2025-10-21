<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class OrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 10);
        $orders = Order::with('user:id,name')
            ->when($request->query('status'), function ($query, $status) {
                return $query->where('status', $status);
            })
            ->when($request->query('search'), function ($query, $search) {
                return $query->whereHas('user', function ($q) use ($search) {
                    $q->where('name', 'like', '%' . $search . '%');
                });
            })
            ->latest()
            ->paginate($perPage);

        return response()->json($orders);
    }

    /**
     * Display the specified resource.
     */
    public function show(Order $order)
    {
        $order->load('user.partnerProfile', 'items');

        return response()->json($order);
    }

    /**
     * Download the invoice for the specified order.
     */
    public function downloadInvoice(Order $order)
    {
        $order->load('user.partnerProfile', 'items');

        $pdf = Pdf::loadView('pdf.invoice', compact('order'));

        return $pdf->download('fatura-' . $order->id . '.pdf');
    }
}
