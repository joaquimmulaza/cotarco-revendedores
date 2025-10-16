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
        $status = $request->input('responseStatus.status');
        $reference = $request->input('reference');

        if (!$merchantTransactionId || !$status) {
            return response()->json(['error' => 'merchantTransactionId and status are required.'], 400);
        }

        $order = Order::where('merchant_transaction_id', $merchantTransactionId)->first();

        if ($order) {
            $order->status = $status;

            // Guardar dados de referência dentro de shipping_details (JSON) para consulta pelo frontend
            if (is_array($reference) && isset($reference['entity']) && isset($reference['referenceNumber'])) {
                $details = is_array($order->shipping_details) ? $order->shipping_details : (json_decode($order->shipping_details, true) ?: []);
                $details['payment_reference'] = [
                    'entity' => $reference['entity'],
                    'referenceNumber' => $reference['referenceNumber'],
                    'dueDate' => $reference['dueDate'] ?? null,
                ];
                $order->shipping_details = $details;
            }

            $order->save();
            return response()->json(['status' => 'received'], 200);
        } else {
            return response()->json(['error' => 'Order not found.'], 404);
        }
    }
}
