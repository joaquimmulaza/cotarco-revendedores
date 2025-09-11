<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            Route::middleware('web')
                ->prefix('distribuidores')
                ->group(base_path('routes/web.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // API sem middleware stateful do Sanctum, pois usamos Bearer tokens
        $middleware->api([]);

        $middleware->alias([
            'admin' => \App\Http\Middleware\AdminMiddleware::class,
            'parceiro' => \App\Http\Middleware\ParceiroMiddleware::class,
            'token.query' => \App\Http\Middleware\TokenFromQuery::class,
        ]);

        // Configurar tratamento de falhas de autenticação para API
        $middleware->redirectGuestsTo(function (Request $request) {
            if ($request->expectsJson()) {
                return null; // Não redireciona para pedidos de API
            }
            // Mantenha um redirecionamento padrão para rotas web, se necessário
            return route('login'); 
        });
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
