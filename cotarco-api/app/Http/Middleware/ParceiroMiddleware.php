<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ParceiroMiddleware
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

        // Verificar se o usuário tem role de parceiro (revendedor ou distribuidor) e está ativo
        if (!in_array($user->role, ['revendedor', 'distribuidor'])) {
            return response()->json([
                'message' => 'Acesso negado. Apenas parceiros (revendedores ou distribuidores) podem acessar esta funcionalidade.',
            ], 403);
        }

        // Verificar se o parceiro está ativo
        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'Acesso negado. Sua conta de parceiro não está ativa.',
            ], 403);
        }

        return $next($request);
    }
}
