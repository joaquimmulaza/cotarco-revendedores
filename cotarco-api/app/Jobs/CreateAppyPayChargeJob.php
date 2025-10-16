<?php

namespace App\Jobs;

use App\Mail\OrderPlacedAdmin;
use App\Mail\OrderPlacedCustomer;
use App\Models\Order;
use App\Models\User;
use App\Services\AppyPayService;
use Illuminate\Bus\Queueable;
use Illuminate\Support\Facades\Mail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CreateAppyPayChargeJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $orderId;
    protected $amount;
    protected $reference;
    protected $description;

    /**
     * Create a new job instance.
     *
     * @param int $orderId
     * @param int $amount
     * @param string $reference
     * @param string $description
     */
    public function __construct($orderId, $amount, $reference, $description)
    {
        $this->orderId = $orderId;
        $this->amount = $amount;
        $this->reference = $reference;
        $this->description = $description;
    }

    /**
     * Execute the job.
     *
     * @param AppyPayService $appyPayService
     * @return void
     */
    public function handle(AppyPayService $appyPayService)
    {
        Log::info("Job CreateAppyPayChargeJob iniciado para a encomenda ID: {$this->orderId}");

        try {
            $order = Order::with('user')->find($this->orderId);
            if (!$order) {
                Log::error('CreateAppyPayChargeJob: Order not found.', ['order_id' => $this->orderId]);
                return;
            }

            // Make the call to the payment service
            $chargeResponse = $appyPayService->createCharge($this->amount, $this->reference, $this->description);

            // Handle the response from the payment service
            $appyPayTransactionId = $chargeResponse['transactionId'] ?? null;
            if ($appyPayTransactionId) {
                $order->update(['appy_pay_transaction_id' => $appyPayTransactionId]);
            }

            $referenceData = $chargeResponse['reference']
                ?? ($chargeResponse['responseStatus']['reference'] ?? null);

            if ($referenceData && isset($referenceData['entity']) && isset($referenceData['referenceNumber'])) {
                Log::info('AppyPay charge created successfully via Job', [
                    'order_id' => $this->orderId,
                    'reference' => $referenceData['referenceNumber'],
                    'entity' => $referenceData['entity'],
                ]);

                // Enviar e-mails de encomenda criada
                try {
                    Log::info("A enviar e-mails de encomenda criada para a encomenda ID: {$order->id}");
                    $paymentDetails = [
                        'entidade' => $referenceData['entity'],
                        'referencia' => $referenceData['referenceNumber'],
                        'valor' => $this->amount,
                    ];

                    // E-mail para o cliente
                    Mail::to($order->user->email)->send(new OrderPlacedCustomer($order, $paymentDetails));

                    // E-mail para o admin
                    $admin = User::where('role', 'admin')->first();
                    if ($admin) {
                        Mail::to($admin->email)->send(new OrderPlacedAdmin($order));
                    }
                } catch (\Throwable $e) {
                    Log::error("Falha ao enviar e-mails de encomenda criada para a encomenda ID: {$order->id}", [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                }

            } else {
                // If the response is invalid or failed
                $order->update(['status' => 'failed']);
                Log::error('Invalid or failed response from AppyPayService in Job', [
                    'order_id' => $this->orderId,
                    'response' => $chargeResponse,
                ]);
            }
        } catch (\Throwable $e) {
            Log::error("Falha ao enviar e-mails de encomenda criada para a encomenda ID: {$this->orderId}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString() // Regista o stack trace completo
            ]);

            // Optionally, find the order and mark it as failed
            $order = Order::find($this->orderId);
            if ($order) {
                $order->update(['status' => 'failed']);
            }
        }
    }
}
