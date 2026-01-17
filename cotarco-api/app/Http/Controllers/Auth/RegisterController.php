<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Actions\Auth\RegisterPartnerAction;
use Illuminate\Http\Request;

class RegisterController extends Controller
{
    /**
     * Handle a registration request for the application.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        // 1. Validar os dados recebidos
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone_number' => 'required|string|max:20',
            'company_name' => 'required|string|max:255',
            'password' => 'required|string|min:8|confirmed',
            'alvara' => 'required|file|mimes:pdf,jpg,jpeg,png|max:2048',
            'business_model' => 'required|string|in:B2B,B2C',
        ], [
            'alvara.required' => 'O arquivo do alvará é obrigatório.',
            'alvara.file' => 'O alvará deve ser um arquivo válido.',
            'alvara.mimes' => 'O alvará deve ser um arquivo PDF, JPG, JPEG ou PNG.',
            'alvara.max' => 'O arquivo do alvará não pode ser maior que 2MB.',
            'email.unique' => 'Este email já está registrado.',
            'password.confirmed' => 'A confirmação da palavra-passe não confere.',
            'password.min' => 'A palavra-passe deve ter pelo menos 8 caracteres.',
        ]);

        try {
            // 2. Executar a Action de registro de parceiro
            $registerPartnerAction = new RegisterPartnerAction();
            $result = $registerPartnerAction->execute($validated, $request);

            // 3. Retornar resposta JSON com sucesso
            return response()->json([
                'message' => $result['message'],
                'user' => [
                    'id' => $result['user']->id,
                    'name' => $result['user']->name,
                    'email' => $result['user']->email,
                    'role' => $result['user']->role,
                    'status' => $result['user']->status,
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro durante o registro. Tente novamente.',
                'error' => config('app.debug') ? $e->getMessage() : 'Erro interno do servidor',
            ], 500);
        }
    }
}
