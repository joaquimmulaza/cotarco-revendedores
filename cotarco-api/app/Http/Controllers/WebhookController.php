<?php

namespace App\Http\Controllers;

use App\Mail\PaymentSuccessAdmin;
use App\Mail\PaymentSuccessCustomer;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Order;
use Illuminate\Support\Facades\Mail;

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

        $order = Order::with('user')->where('merchant_transaction_id', $merchantTransactionId)->first();

        if ($order) {
            if (strtolower($status) === 'success' && $order->status !== 'success') {
                $order->update(['status' => 'success']);

                // --- ATUALIZAÇÃO DE STOCK ---
                foreach ($order->items as $item) {
                    $sku = $item->product_sku;
                    $quantitySold = $item->quantity;

                    // 1. Atualizar Stock Local (ProductPrice)
                    $productPrice = \App\Models\ProductPrice::where('product_sku', $sku)->first();
                    
                    if ($productPrice) {
                        $productPrice->decrement('stock_quantity', $quantitySold);
                        $productPrice->refresh(); 

                        // 2. Se o stock ficar a 0 ou menos, marcar como Fora de Stock na tabela de Produtos
                        if ($productPrice->stock_quantity <= 0) {
                             \App\Models\Product::where('sku', $sku)->update(['stock_status' => 'outofstock']);
                        }
                    }
                }
                // -----------------------------

                Log::info("A enviar e-mails de pagamento confirmado para a encomenda ID: {$order->id}");
                try {
                    // Enviar e-mail para o cliente
                    Mail::to($order->user->email)->send(new PaymentSuccessCustomer($order));

                    // Enviar e-mail para o admin
                    $admin = User::where('role', 'admin')->first();
                    if ($admin) {
                        Mail::to($admin->email)->send(new PaymentSuccessAdmin($order));
                    }
                } catch (\Throwable $e) {
                    Log::error("Falha ao enviar e-mails de pagamento confirmado para a encomenda ID: {$order->id}", [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                }
            } else {
                $order->status = $status;
            }

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
