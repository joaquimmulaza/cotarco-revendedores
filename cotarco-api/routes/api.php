<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\PartnerController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\StockFileController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\WebhookController;
use Illuminate\Support\Facades\Http;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Rotas públicas (não precisam de autenticação)
Route::post('/register', [RegisterController::class, 'store']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/admin/login', [AuthController::class, 'adminLogin']);

// Rotas para Password Reset
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->name('password.reset');

// Rota de teste
Route::get('/test', fn() => response()->json(['message' => 'API funcionando!']));

// Rota de teste para debug do custom_description
Route::get('/test-product/{id}', function ($id, App\Services\WooCommerceService $wooCommerceService) {
    // Busca um único produto usando a API do WooCommerce
    $response = Http::withBasicAuth(config('services.woocommerce.consumer_key'), config('services.woocommerce.consumer_secret'))
        ->get(config('services.woocommerce.store_url') . '/wp-json/wc/v3/products/' . $id);
    
    if (!$response->successful()) {
        return response()->json(['error' => 'Produto não encontrado'], 404);
    }
    
    $productData = $response->json();
    
    // Usar reflexão para chamar o método privado fetchCustomDescription
    $reflection = new ReflectionClass($wooCommerceService);
    $method = $reflection->getMethod('fetchCustomDescription');
    $method->setAccessible(true);
    
    $productData['custom_description_url'] = $method->invokeArgs($wooCommerceService, [$productData]);
    
    return response()->json($productData);
});

// Rotas de verificação de email
Route::get('/email/verify/{id}/{hash}', function ($id, $hash, Request $request) {
    \Illuminate\Support\Facades\Log::info('=== VERIFICAÇÃO DE EMAIL INICIADA ===', [
        'id' => $id,
        'hash' => $hash,
        'url' => $request->fullUrl(),
        'user_agent' => $request->userAgent(),
        'ip' => $request->ip(),
        'timestamp' => now()->toDateTimeString()
    ]);
    
    try {
        // Buscar o usuário pelo ID
        $user = \App\Models\User::findOrFail($id);
        \Illuminate\Support\Facades\Log::info('Usuário encontrado', [
            'user_id' => $user->id, 
            'email' => $user->email,
            'current_status' => $user->status,
            'email_verified_at' => $user->email_verified_at
        ]);
        
        // Verificar se o hash está correto
        $expectedHash = sha1($user->getEmailForVerification());
        \Illuminate\Support\Facades\Log::info('Verificação de hash', [
            'expected' => $expectedHash,
            'received' => $hash,
            'hash_match' => hash_equals((string) $hash, $expectedHash)
        ]);
        
        if (!hash_equals((string) $hash, $expectedHash)) {
            \Illuminate\Support\Facades\Log::error('Hash inválido', [
                'expected' => $expectedHash,
                'received' => $hash
            ]);
            
            // Redirecionar para página de erro amigável no frontend
            $frontendUrl = env('FRONTEND_URL', 'https://cotarco.com/distribuidores');
            return redirect($frontendUrl . '/email-verification-error?reason=invalid');
        }
        
        // Verificar se o link não expirou
        $signatureValid = $request->hasValidSignature();
        \Illuminate\Support\Facades\Log::info('Verificação de assinatura', [
            'signature_valid' => $signatureValid,
            'expires' => $request->query('expires'),
            'signature' => $request->query('signature')
        ]);
        
        if (!$signatureValid) {
            \Illuminate\Support\Facades\Log::error('Assinatura inválida ou expirada');
            
            // Redirecionar para página de erro amigável no frontend
            $frontendUrl = env('FRONTEND_URL', 'https://cotarco.com/distribuidores');
            return redirect($frontendUrl . '/email-verification-error?reason=expired');
        }
        
        // ✅ MARCAR EMAIL COMO VERIFICADO
        $wasVerified = $user->hasVerifiedEmail();
        if (!$wasVerified) {
            $user->markEmailAsVerified();
            \Illuminate\Support\Facades\Log::info('Email marcado como verificado', [
                'user_id' => $user->id,
                'email_verified_at' => $user->fresh()->email_verified_at
            ]);
        } else {
            \Illuminate\Support\Facades\Log::info('Email já estava verificado', [
                'user_id' => $user->id,
                'email_verified_at' => $user->email_verified_at
            ]);
        }
        
        // ✅ ATUALIZAR STATUS PARA PENDING_APPROVAL
        $oldStatus = $user->status;
        $user->update(['status' => 'pending_approval']);
        \Illuminate\Support\Facades\Log::info('Status atualizado', [
            'user_id' => $user->id,
            'old_status' => $oldStatus,
            'new_status' => $user->fresh()->status
        ]);
        
        // Enviar notificação para admin
        try {
            $adminUser = \App\Models\User::where('role', 'admin')->first();
            if ($adminUser && filter_var($adminUser->email, FILTER_VALIDATE_EMAIL)) {
                $dashboardUrl = env('FRONTEND_URL', 'https://cotarco.com/distribuidores') . '/admin/login';
                \Illuminate\Support\Facades\Mail::to($adminUser->email)
                    ->send(new \App\Mail\AdminNewPartnerNotification($user, $dashboardUrl));
                
                \Illuminate\Support\Facades\Log::info('Email de notificação enviado para admin', ['admin_email' => $adminUser->email]);
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Erro ao enviar email para admin', ['error' => $e->getMessage()]);
        }
        
        // ✅ REDIRECIONAR PARA O FRONTEND REACT
        $frontendUrl = env('FRONTEND_URL', 'https://cotarco.com/distribuidores');
        \Illuminate\Support\Facades\Log::info('=== VERIFICAÇÃO DE EMAIL CONCLUÍDA COM SUCESSO ===', [
            'user_id' => $user->id,
            'redirect_url' => $frontendUrl . '/email-validated'
        ]);
        
        return redirect($frontendUrl . '/email-validated');
        
    } catch (\Exception $e) {
        \Illuminate\Support\Facades\Log::error('=== ERRO NA VERIFICAÇÃO DE EMAIL ===', [
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ]);
        
        // Redirecionar para página de erro amigável no frontend
        $frontendUrl = env('FRONTEND_URL', 'https://cotarco.com/distribuidores');
        return redirect($frontendUrl . '/email-verification-error?reason=error');
    }
    
})->name('verification.verify');

Route::post('/webhooks/appypay', [App\Http\Controllers\WebhookController::class, 'handleAppyPay']);

// Rotas Protegidas (requerem autenticação)
Route::middleware('auth:sanctum')->group(function () {
    
    // Rota para obter dados do utilizador autenticado
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Rota de logout
    Route::post('/logout', [AuthController::class, 'logout']);

    // Grupo de Rotas de Administração
    Route::prefix('admin')->middleware('admin')->group(function () {
        
        // Dashboard
        Route::get('/dashboard-stats', [AdminController::class, 'getDashboardStats']);

        // Produtos (listagem para admin com preços B2B e B2C)
        Route::get('/products', [ProductController::class, 'indexForAdmin']);

        // Gestão de Parceiros (nova estrutura)
        Route::prefix('partners')->group(function () {
            Route::get('/', [PartnerController::class, 'index']);
            Route::get('/statistics', [PartnerController::class, 'statistics']);
            Route::get('/{user}', [PartnerController::class, 'show']);
            Route::put('/{user}', [PartnerController::class, 'update']);
            Route::put('/{user}/status', [PartnerController::class, 'updateStatus']);
            Route::patch('/{user}/profile', [PartnerController::class, 'updateProfile']);
            
            // Adicione a rota de alvará aqui
            Route::get('/{user}/alvara', [PartnerController::class, 'downloadAlvara'])->name('admin.partner.alvara.download');
        });

        // Gestão de Ficheiros de Stock
        Route::prefix('stock-files')->group(function () {
            Route::get('/', [StockFileController::class, 'getStockFiles']);
            Route::post('/upload', [StockFileController::class, 'uploadOrUpdate']);
            Route::patch('/{file}/toggle-status', [StockFileController::class, 'toggleStatus']);
            Route::delete('/{file}', [StockFileController::class, 'destroy']);
        });

        // Gestão de Encomendas
        Route::get('/orders', [AdminOrderController::class, 'index']);
        Route::get('/orders/{order}', [AdminOrderController::class, 'show']);

        // Rotas de Revendedores (estrutura antiga - mantida para compatibilidade)
        Route::prefix('revendedores')->group(function () {
            Route::get('/', [AdminController::class, 'index']);
            Route::get('/pending', [AdminController::class, 'getPendingPartners']); // Rota antiga
            // Rotas de aprovação/rejeição removidas - usar /admin/partners/{user}/status
        });
    });

    // Grupo de Rotas para Parceiros (Revendedores e Distribuidores)
    Route::prefix('parceiro')->middleware('parceiro')->group(function () {
        Route::prefix('stock-files')->group(function () {
            Route::get('/', [StockFileController::class, 'getForPartner']);
            Route::get('/download', [StockFileController::class, 'downloadForPartner']);
            Route::get('/{file}/download', [StockFileController::class, 'downloadSpecificFile']);
        });
    });

    // Rota de Categorias (protegida apenas por auth:sanctum)
    Route::get('/categories', [CategoryController::class, 'index']);

    // Rotas de Produtos (protegidA por auth:sanctum e parceiro)
    Route::middleware('parceiro')->group(function () {
        Route::get('/products', [ProductController::class, 'index']);
        
        // Pagamentos / Encomendas
        Route::post('/orders/create-payment', [OrderController::class, 'createPayment']);
        Route::get('/orders/payment-reference/{merchantTransactionId}', function ($merchantTransactionId) {
            $order = \App\Models\Order::where('merchant_transaction_id', $merchantTransactionId)->first();
            if (!$order) {
                return response()->json(['message' => 'Order not found'], 404);
            }
            $details = is_array($order->shipping_details) ? $order->shipping_details : (json_decode($order->shipping_details, true) ?: []);
            $ref = $details['payment_reference'] ?? null;
            if ($ref && isset($ref['entity']) && isset($ref['referenceNumber'])) {
                return response()->json([
                    'entity' => $ref['entity'],
                    'reference' => $ref['referenceNumber'],
                    'amount' => (int) $order->total_amount,
                ]);
            }
            return response()->json(['message' => 'Reference not ready'], 202);
        });
    });
});
