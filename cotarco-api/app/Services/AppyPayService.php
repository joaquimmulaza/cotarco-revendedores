<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AppyPayService
{
    protected $clientId;
    protected $clientSecret;
    protected $resource;
    protected $paymentMethodId;
    protected $authUrl;
    protected $apiUrl;

    public function __construct()
    {
        $this->clientId = config('appypay.client_id');
        $this->clientSecret = config('appypay.client_secret');
        $this->resource = config('appypay.resource');
        $this->paymentMethodId = config('appypay.payment_method_id');
        $this->authUrl = config('appypay.auth_url');
        $this->apiUrl = config('appypay.api_url');
    }

    public function getAccessToken()
    {
        if (Cache::has('appypay_access_token')) {
            return Cache::get('appypay_access_token');
        }

        $response = Http::asForm()->post($this->authUrl, [
            'grant_type' => 'client_credentials',
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'resource' => $this->resource,
        ]);

        if ($response->failed()) {
            Log::error('AppyPay OAuth failed', [
                'response' => $response->body(),
            ]);
            return null;
        }

        $data = $response->json();
        $accessToken = $data['access_token'];
        $expiresIn = $data['expires_in'];

        Cache::put('appypay_access_token', $accessToken, $expiresIn - 60);

        return $accessToken;
    }

    public function createCharge($amount, $merchantTransactionId, $description)
    {
        $accessToken = $this->getAccessToken();

        if (!$accessToken) {
            return [
                'success' => false,
                'message' => 'Unable to retrieve access token.',
            ];
        }

        $payload = [
            'amount' => $amount,
            'currency' => 'AOA',
            'description' => $description,
            'merchantTransactionId'  => $merchantTransactionId,
            'paymentMethod' => 'REF_' . $this->paymentMethodId,
        ];

        $response = Http::withToken($accessToken)
            ->timeout(30)
            ->acceptJson()
            ->post($this->apiUrl . '/v2.0/charges', $payload);

        if ($response->failed()) {
            Log::error('AppyPay charge creation failed', [
                'status' => $response->status(),
                'response' => $response->body(),
            ]);
        }

        return $response->json();
    }
}
