<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\Request;

// Rotas de verificação de email movidas para routes/api.php


Route::post('/email/verification-notification', function (Request $request) {
    $request->user()->sendEmailVerificationNotification();
    
    return back()->with('status', 'Email de verificação reenviado!');
})->middleware(['auth', 'throttle:6,1'])->name('verification.send');

// Rota catch-all removida para evitar interceptação das rotas de verificação
// Se precisar de redirecionamento para o frontend, adicione rotas específicas
