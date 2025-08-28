<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Handle a login request for the application.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        // Validar email e password
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        // Verificar se as credenciais estão corretas
        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'message' => 'Credenciais inválidas.',
            ], 401);
        }

        // Verificar se o status do utilizador é 'active'
        if ($user->status !== 'active') {
            $statusMessages = [
                'pending_email_validation' => 'Conta pendente de verificação de email. Verifique sua caixa de entrada.',
                'pending_approval' => 'Conta pendente de aprovação. Aguarde a aprovação do administrador.',
                'rejected' => 'Conta rejeitada. Entre em contato com o suporte.',
            ];

            $message = $statusMessages[$user->status] ?? 'Conta desativada ou pendente de aprovação.';

            return response()->json([
                'message' => $message,
                'status' => $user->status,
            ], 403);
        }

        // Gerar token de API usando Laravel Sanctum
        $token = $user->createToken('auth-token')->plainTextToken;

        // Retornar token e dados do usuário
        return response()->json([
            'message' => 'Login realizado com sucesso.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status,
            ],
            'token' => $token,
        ], 200);
    }

    /**
     * Handle an admin login request for the application.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function adminLogin(Request $request)
    {
        // Validar email e password
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        // Verificar se as credenciais estão corretas
        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'message' => 'Credenciais inválidas.',
            ], 401);
        }

        // Verificar se o utilizador é administrador
        if ($user->role !== 'admin') {
            return response()->json([
                'message' => 'Acesso negado. Apenas administradores podem aceder ao painel.',
            ], 403);
        }

        // Verificar se o status do utilizador é 'active'
        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'Conta de administrador desativada ou pendente de aprovação.',
            ], 403);
        }

        // Gerar token de API usando Laravel Sanctum
        $token = $user->createToken('admin-token')->plainTextToken;

        // Retornar token e dados do usuário
        return response()->json([
            'message' => 'Login de administrador realizado com sucesso.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status,
            ],
            'token' => $token,
        ], 200);
    }

    /**
     * Handle a logout request for the application.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request)
    {
        // Revogar o token do utilizador autenticado
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout realizado com sucesso.',
        ], 200);
    }
}
