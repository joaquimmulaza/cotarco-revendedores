<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\PartnerController;
use App\Http\Controllers\StockFileController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Rota de teste para verificar se a API está funcionando
Route::get('/test', function () {
    return response()->json([
        'message' => 'API funcionando!',
        'timestamp' => now(),
        'status' => 'success'
    ]);
});

// Rotas de autenticação
Route::post('/register', [RegisterController::class, 'store']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/admin/login', [AuthController::class, 'adminLogin']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// Rotas de administração
Route::prefix('admin')->group(function () {
    // Rota para estatísticas do dashboard
    Route::get('/dashboard-stats', [AdminController::class, 'getDashboardStats']);
    
    // Nova rota flexível para listar revendedores com filtros
    Route::get('/revendedores', [AdminController::class, 'index']);
    
    // Nova rota genérica para atualizar status
    Route::put('/revendedores/{user}/status', [AdminController::class, 'updateStatus']);
    
    // Rotas específicas mantidas para compatibilidade (podem ser removidas futuramente)
    Route::get('/revendedores/pending', [AdminController::class, 'getPendingRevendedores']);
    Route::post('/revendedores/{user}/approve', [AdminController::class, 'approveRevendedor']);
    Route::post('/revendedores/{user}/reject', [AdminController::class, 'rejectRevendedor']);
    
    // Rota para download do alvará
    Route::get('/revendedores/{user}/alvará', [AdminController::class, 'downloadAlvara']);
    
    // Rotas para gestão de ficheiros de stock
    Route::post('/stock-file/upload', [StockFileController::class, 'uploadOrUpdate']);
    Route::get('/stock-file/current', [StockFileController::class, 'getCurrentForAdmin']);
    Route::patch('/stock-file/{file}/toggle-status', [StockFileController::class, 'toggleStatus']);
    Route::delete('/stock-file/{file}', [StockFileController::class, 'destroy']);
    
    // Rotas para gestão de parceiros
    Route::prefix('partners')->group(function () {
        Route::get('/', [PartnerController::class, 'index']);
        Route::get('/{user}', [PartnerController::class, 'show']);
        Route::put('/{user}', [PartnerController::class, 'update']);
        Route::put('/{user}/status', [PartnerController::class, 'updateStatus']);
        Route::patch('/{user}/profile', [PartnerController::class, 'updateProfile']);
        Route::get('/statistics', [PartnerController::class, 'statistics']);
    });
});

// Rotas para revendedores
Route::prefix('revendedor')->group(function () {
    Route::get('/stock-file/info', [StockFileController::class, 'getForRevendedor']);
    Route::get('/stock-file/download', [StockFileController::class, 'downloadForRevendedor']);
});
