<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class TokenFromQuery
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        \Illuminate\Support\Facades\Log::info('Global API Request Tracer', [
            'method' => $request->method(),
            'path' => $request->path(),
            'auth_header' => $request->header('Authorization') ? 'Present (length ' . strlen($request->header('Authorization')) . ')' : 'Missing',
        ]);

        // Se existe token na query string, adicionar ao header Authorization
        if ($request->has('token') && !$request->hasHeader('Authorization')) {
            $token = $request->query('token');
            $request->headers->set('Authorization', 'Bearer ' . $token);
        }

        return $next($request);
    }
}



