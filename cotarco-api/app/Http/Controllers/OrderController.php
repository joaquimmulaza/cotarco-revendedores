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
            $order = null;
            $response = DB::transaction(function () use ($request, $appyPayService, $amount, $reference, $description, $shippingDetails, &$order) {
                $order = Order::create([
                    'user_id' => auth()->user()->id,
                    'merchant_transaction_id' => $reference,
                    'total_amount' => $amount,
                    'shipping_details' => json_encode($shippingDetails),
                    'status' => 'pending',
                ]);

                $chargeResponse = $appyPayService->createCharge($amount, $reference, $description);

                $appyPayTransactionId = $chargeResponse['transactionId'] ?? null;
                if ($appyPayTransactionId) {
                    $order->update(['appy_pay_transaction_id' => $appyPayTransactionId]);
                }

                return $chargeResponse;
            });


            $referenceData = $response['responseStatus']['reference'] ?? null;
            if ($referenceData && isset($referenceData['entity']) && isset($referenceData['referenceNumber'])) {
                Log::info('AppyPay charge created successfully', [
                    'reference' => $referenceData['referenceNumber'],
                    'entity' => $referenceData['entity'],
                ]);

                return response()->json([
                    'entity' => $referenceData['entity'],
                    'reference' => $referenceData['referenceNumber'],
                    'amount' => $amount, // Vamos também retornar o valor para a página de sucesso
                ]);
            }

            Log::error('Invalid response from AppyPayService', [
                'response' => $response,
            ]);

            return response()->json([
                'message' => 'Falha ao criar pagamento na AppyPay.',
                'details' => $response,
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
