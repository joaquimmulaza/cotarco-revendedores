<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RevendedorMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Verificar se o usuário está autenticado
        if (!$request->user()) {
            return response()->json([
                'message' => 'Não autenticado.',
            ], 401);
        }

        // Verificar se o usuário tem role de revendedor e está ativo
        if ($request->user()->role !== 'revendedor') {
            return response()->json([
                'message' => 'Acesso negado. Apenas revendedores podem acessar esta funcionalidade.',
            ], 403);
        }

        // Verificar se o revendedor está ativo
        if ($request->user()->status !== 'active') {
            return response()->json([
                'message' => 'Acesso negado. Sua conta de revendedor não está ativa.',
            ], 403);
        }

        return $next($request);
    }
}
