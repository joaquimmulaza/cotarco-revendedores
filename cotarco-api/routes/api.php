<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Admin\AdminController;

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
    Route::get('/revendedores/{user}/alvara', [AdminController::class, 'downloadAlvara']);
});
