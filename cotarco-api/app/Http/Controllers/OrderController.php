<?php

namespace App\Http\Controllers;

use App\Services\AppyPayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    public function createPayment(Request $request, AppyPayService $appyPayService)
    {
        $cartItems = $request->input('items', []);

        // Calculate total amount from items
        $amount = 0;
        foreach ($cartItems as $item) {
            $price = (float)($item['price'] ?? 0);
            $qty = (int)($item['quantity'] ?? 0);
            $amount += $price * $qty;
        }

        // Ensure amount is an integer (AppyPay expects integer for AOA)
        $amount = (int) round($amount);

        // Generate unique reference (transaction id)
        $reference = 'cotarco-' . uniqid();

        // Description for the charge
        $description = 'Encomenda Cotarco #' . $reference;

        try {
            $response = $appyPayService->createCharge($amount, $reference, $description);

            if (isset($response['entity']) && isset($response['reference'])) {
                Log::info('AppyPay charge created successfully', [
                    'reference' => $response['reference'],
                    'entity' => $response['entity'],
                ]);

                return response()->json([
                    'entity' => $response['entity'],
                    'reference' => $response['reference'],
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
