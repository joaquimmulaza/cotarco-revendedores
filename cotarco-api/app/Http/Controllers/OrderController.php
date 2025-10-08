<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    public function createPayment(Request $request)
    {
        Log::info('createPayment method called');
        $user = $request->user();
        if (!$user) {
            Log::error('User not authenticated');
            return response()->json(['message' => 'User not authenticated'], 401);
        }

        $cartItems = $request->input('items', []);
        $customerDetails = $request->input('details', []);

        // Calculate total amount from items
        $amount = 0;
        foreach ($cartItems as $item) {
            $price = (float)($item['price'] ?? 0);
            $qty = (int)($item['quantity'] ?? 0);
            $amount += $price * $qty;
        }

        // Ensure amount is a numeric string
        $amount = (string) $amount;

        // Generate unique transaction id
        $transactionId = uniqid('cotarco-');

        // Load AppyPay credentials from config
        $merchantId = config('services.appypay.merchant_id');
        $apiKey = config('services.appypay.api_key');
        $baseUrl = config('services.appypay.url');

        if (!$merchantId || !$apiKey || !$baseUrl) {
            return response()->json([
                'message' => 'Configuração AppyPay ausente.',
            ], 500);
        }

        // Security hash
        $hash = hash('sha256', $merchantId . $transactionId . $amount . $apiKey);

        $payload = [
            'merchantId' => $merchantId,
            'amount' => $amount,
            'reference' => $transactionId,
            'description' => 'Encomenda Cotarco',
            'hash' => $hash,
            'customer' => [
                'name' => $customerDetails['fullName'] ?? ($user->name ?? ''),
                'company' => $customerDetails['companyName'] ?? ($user->partner_profile['company_name'] ?? ''),
                'address' => $customerDetails['shippingAddress'] ?? '',
                'city' => $customerDetails['city'] ?? '',
                'phone' => $customerDetails['phoneNumber'] ?? '',
                'email' => $user->email ?? '',
            ],
            'items' => $cartItems,
        ];

        try {
            Log::info('Sending payment request to AppyPay', ['url' => rtrim($baseUrl, '/') . '/charges', 'payload' => $payload]);
            $response = Http::withHeaders([
                'X-Api-Key' => $apiKey,
            ])->post(rtrim($baseUrl, '/') . '/charges', $payload);
            Log::info('Received response from AppyPay', [
                'status' => $response->status(),
                'body' => $response->json() ?? $response->body(),
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $paymentUrl = $data['payment_url'] ?? null;
                if ($paymentUrl) {
                    return response()->json([
                        'payment_url' => $paymentUrl,
                    ]);
                }
                return response()->json([
                    'message' => 'Resposta inválida da AppyPay.',
                    'details' => $data,
                ], 502);
            }

            return response()->json([
                'message' => 'Falha ao criar pagamento na AppyPay.',
                'details' => $response->json(),
            ], $response->status());
        } catch (\Throwable $e) {
            Log::error('Erro ao criar pagamento AppyPay', [
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'message' => 'Erro interno ao criar pagamento.',
            ], 500);
        }
    }
}
