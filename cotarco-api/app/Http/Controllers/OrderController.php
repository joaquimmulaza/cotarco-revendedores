<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\AppyPayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Jobs\CreateAppyPayChargeJob;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function createPayment(Request $request, AppyPayService $appyPayService)
    {
        if (!auth()->check()) {
            return response()->json(['message' => 'Sessão inválida ou expirada. Por favor, faça login novamente.'], 401);
        }

        $cartItems = $request->input('items', []);
        $shippingDetails = $request->input('details', []);

        // Calculate total amount from items
        $amount = 0;
        foreach ($cartItems as $item) {
            $price = (float)($item['price'] ?? 0);
            $qty = (int)($item['quantity'] ?? 0);
            $amount += $price * $qty;
        }

        // Ensure amount is an integer (AppyPay expects integer for AOA)
        $amount = (int) round($amount);

        // Generate unique reference (transaction id) - must be alphanumeric, max 15 chars
        $reference = 'TR' . strtoupper(Str::random(13));

        // Description for the charge
        $description = 'Encomenda Cotarco #' . $reference;

        try {
            $order = DB::transaction(function () use ($cartItems, $shippingDetails, $reference, $amount) {
                // 1. Create the order with 'pending' status
                $order = Order::create([
                    'user_id' => auth()->user()->id,
                    'merchant_transaction_id' => $reference,
                    'total_amount' => $amount,
                    'shipping_details' => $shippingDetails,
                    'status' => 'pending',
                ]);

                // 2. Create order items
                foreach ($cartItems as $item) {
                    $order->items()->create([
                        'product_sku' => $item['sku'],
                        'name' => $item['name'],
                        'quantity' => $item['quantity'],
                        'price' => $item['price'],
                        'image_url' => $item['image_url'] ?? null,
                    ]);
                }

                return $order;
            });

            // 3. Dispatch the job to handle the AppyPay charge creation
            CreateAppyPayChargeJob::dispatch($order->id, $amount, $reference, $description);

            // 3. Return an immediate 202 Accepted response
            // The frontend will use the merchantTransactionId for polling
            return response()->json([
                'merchantTransactionId' => $reference,
                'message' => 'O seu pedido de pagamento foi recebido e está a ser processado.',
            ], 202);

        } catch (\Throwable $e) {
            Log::error('Erro ao criar a encomenda ou ao enviar para a fila', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Erro interno ao processar o seu pedido.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
