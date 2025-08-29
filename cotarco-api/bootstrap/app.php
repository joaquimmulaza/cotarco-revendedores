<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // API sem middleware stateful do Sanctum, pois usamos Bearer tokens
        $middleware->api([]);

        $middleware->alias([
            'admin' => \App\Http\Middleware\AdminMiddleware::class,
            'revendedor' => \App\Http\Middleware\RevendedorMiddleware::class,
            'token.query' => \App\Http\Middleware\TokenFromQuery::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
