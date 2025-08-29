<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Verificar se o usuário está autenticado via Sanctum
        if (!$request->user('sanctum')) {
            return response()->json([
                'message' => 'Não autenticado.',
            ], 401);
        }

        $user = $request->user('sanctum');

        // Verificar se o usuário tem role de admin
        if ($user->role !== 'admin') {
            return response()->json([
                'message' => 'Acesso negado. Apenas administradores podem acessar esta funcionalidade.',
            ], 403);
        }

        return $next($request);
    }
}
