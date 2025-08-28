<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Laravel\Sanctum\PersonalAccessToken;

class TokenQueryAuth
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Verificar se há token na query string
        $token = $request->query('token');
        
        if ($token) {
            // Buscar o token no banco de dados
            $accessToken = PersonalAccessToken::findToken($token);
            
            if ($accessToken && !$accessToken->cant('*')) {
                // Definir o usuário autenticado
                auth()->setUser($accessToken->tokenable);
                
                // Verificar se é admin
                if (auth()->user()->role !== 'admin') {
                    return response()->json(['message' => 'Acesso negado. Apenas administradores podem acessar este recurso.'], 403);
                }
                
                return $next($request);
            }
        }
        
        // Se chegou aqui, a autenticação falhou
        return response()->json(['message' => 'Token inválido ou não fornecido.'], 401);
    }
}