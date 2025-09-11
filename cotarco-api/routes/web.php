<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\Request;

// Rotas de verificação de email (definidas antes da rota catch-all)
Route::get('/email/verify', function () {
    return view('auth.verify-email');
})->middleware('auth')->name('verification.notice');

Route::get('/email/verify/{id}/{hash}', function ($id, $hash, Request $request) {
    // Buscar o usuário pelo ID
    $user = \App\Models\User::findOrFail($id);
    
    // Verificar se o hash está correto
    if (!hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
        abort(403);
    }
    
    // Verificar se o link não expirou (usando o timestamp da URL se houver)
    if ($request->hasValidSignature()) {
        // Marcar email como verificado
        if (!$user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }
        
        // Atualizar status do usuário para pending_approval
        $user->update(['status' => 'pending_approval']);
        
        // Enviar notificação para admin se for parceiro
        if (in_array($user->role, ['revendedor', 'distribuidor'])) {
            try {
                // Obter email do admin principal
                $adminUser = \App\Models\User::where('role', 'admin')->first();
                if ($adminUser && filter_var($adminUser->email, FILTER_VALIDATE_EMAIL)) {
                    $dashboardUrl = env('FRONTEND_URL', 'http://localhost:5173') . '/admin';
                    \Illuminate\Support\Facades\Mail::to($adminUser->email)
                        ->send(new \App\Mail\AdminNewPartnerNotification($user, $dashboardUrl));
                    
                    \Illuminate\Support\Facades\Log::info('Email de notificação enviado para admin: ' . $adminUser->email);
                } else {
                    \Illuminate\Support\Facades\Log::warning('Admin não encontrado ou email inválido para notificação de novo parceiro');
                }
            } catch (\Exception $e) {
                // Log do erro mas não impedir o processo
                \Illuminate\Support\Facades\Log::error('Erro ao enviar email para admin: ' . $e->getMessage());
            }
        }
        
        // Redirecionar para o frontend React
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        return redirect($frontendUrl . '/email-validated');
    }
    
    abort(403);
})->name('verification.verify');

Route::post('/email/verification-notification', function (Request $request) {
    $request->user()->sendEmailVerificationNotification();
    
    return back()->with('status', 'Email de verificação reenviado!');
})->middleware(['auth', 'throttle:6,1'])->name('verification.send');

// Esta rota "apanha-tudo" vai garantir que qualquer pedido que não seja de API
// carregue a sua aplicação React, em vez da página de boas-vindas do Laravel.
// Deve ser definida por último para não interceptar as rotas específicas acima.
Route::get('/{any?}', function () {
    return file_get_contents(public_path('index.html'));
})->where('any', '.*');
