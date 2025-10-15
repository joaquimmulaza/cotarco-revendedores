<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Order;

class WebhookController extends Controller
{
    public function handleAppyPay(Request $request)
    {
        Log::info('Webhook AppyPay recebido:', $request->all());

        $merchantTransactionId = $request->input('merchantTransactionId');
        $status = $request->input('status');

        if (!$merchantTransactionId || !$status) {
            return response()->json(['error' => 'merchantTransactionId and status are required.'], 400);
        }

        $order = Order::where('merchant_transaction_id', $merchantTransactionId)->first();

        if ($order) {
            $order->status = $status;
            $order->save();
            return response()->json(['status' => 'received'], 200);
        } else {
            return response()->json(['error' => 'Order not found.'], 404);
        }
    }
}
