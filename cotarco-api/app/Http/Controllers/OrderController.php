<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\AppyPayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
            // 1. Create the order first, outside of a transaction that includes the API call
            $order = Order::create([
                'user_id' => auth()->user()->id,
                'merchant_transaction_id' => $reference,
                'total_amount' => $amount,
                'shipping_details' => json_encode($shippingDetails),
                'status' => 'pending',
            ]);

            // 2. Now, make the call to the payment service
            $chargeResponse = $appyPayService->createCharge($amount, $reference, $description);

            // 3. Handle the response from the payment service
            $appyPayTransactionId = $chargeResponse['transactionId'] ?? null;
            if ($appyPayTransactionId) {
                $order->update(['appy_pay_transaction_id' => $appyPayTransactionId]);
            }

            // Estrutura esperada da AppyPay (conforme logs de webhook):
            // {
            //   "reference": { "referenceNumber": "...", "entity": "...", ... },
            //   "responseStatus": { ... }
            // }
            $referenceData = $chargeResponse['reference']
                ?? ($chargeResponse['responseStatus']['reference'] ?? null);

            if ($referenceData && isset($referenceData['entity']) && isset($referenceData['referenceNumber'])) {
                Log::info('AppyPay charge created successfully', [
                    'order_id' => $order->id,
                    'reference' => $referenceData['referenceNumber'],
                    'entity' => $referenceData['entity'],
                ]);

                // The order status remains 'pending' until the webhook confirms payment
                return response()->json([
                    'entity' => $referenceData['entity'],
                    'reference' => $referenceData['referenceNumber'],
                    'amount' => $amount,
                ]);
            }

            // Se houve falha de conexão/timeout, devolver 202 com o transaction id para o frontend poder fazer polling
            if (($chargeResponse['success'] ?? true) === false) {
                Log::warning('AppyPayService connection issue when creating charge', [
                    'order_id' => $order->id,
                    'response' => $chargeResponse,
                ]);

                // Mantém a encomenda como 'pending' e aguarda webhook
                return response()->json([
                    'merchantTransactionId' => $reference,
                    'message' => 'Aguardando confirmação do serviço de pagamentos.',
                ], 202);
            }

            // Caso a resposta não tenha o formato esperado
            $order->update(['status' => 'failed']);
            Log::error('Invalid or failed response from AppyPayService', [
                'order_id' => $order->id,
                'response' => $chargeResponse,
            ]);

            return response()->json([
                'message' => 'Falha ao iniciar o pagamento. Por favor, tente novamente.',
            ], 502);

        } catch (\Throwable $e) {
            Log::error('Erro ao criar pagamento AppyPay', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Erro interno ao criar pagamento.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
