<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\PartnerController;
use App\Http\Controllers\StockFileController;

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

        // Rotas de Revendedores (estrutura antiga e outras)
        Route::prefix('revendedores')->group(function () {
            Route::get('/', [AdminController::class, 'index']);
            Route::get('/pending', [AdminController::class, 'getPendingRevendedores']); // Rota antiga
            Route::post('/{user}/approve', [AdminController::class, 'approveRevendedor']); // Rota antiga
            Route::post('/{user}/reject', [AdminController::class, 'rejectRevendedor']); // Rota antiga
        });
    });

    // Grupo de Rotas para Parceiros (Revendedores e Distribuidores)
    Route::prefix('parceiro')->middleware('parceiro')->group(function () {
        Route::prefix('stock-files')->group(function () {
            Route::get('/', [StockFileController::class, 'getForRevendedor']);
            Route::get('/download', [StockFileController::class, 'downloadForRevendedor']);
            Route::get('/{file}/download', [StockFileController::class, 'downloadSpecificFile']);
        });
    });

    // Manter rotas antigas para compatibilidade (deprecated)
    Route::prefix('revendedor')->middleware('revendedor')->group(function () {
        Route::prefix('stock-files')->group(function () {
            Route::get('/', [StockFileController::class, 'getForRevendedor']);
            Route::get('/download', [StockFileController::class, 'downloadForRevendedor']);
            Route::get('/{file}/download', [StockFileController::class, 'downloadSpecificFile']);
        });
    });
});