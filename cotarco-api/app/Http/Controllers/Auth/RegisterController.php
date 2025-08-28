<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\RevendedorProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Str;

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
        ], [
            'alvara.required' => 'O arquivo do alvará é obrigatório.',
            'alvara.file' => 'O alvará deve ser um arquivo válido.',
            'alvara.mimes' => 'O alvará deve ser um arquivo PDF, JPG, JPEG ou PNG.',
            'alvara.max' => 'O arquivo do alvará não pode ser maior que 2MB.',
            'email.unique' => 'Este email já está registrado.',
            'password.confirmed' => 'A confirmação da palavra-passe não confere.',
            'password.min' => 'A palavra-passe deve ter pelo menos 8 caracteres.',
        ]);

        // Iniciar transação de base de dados
        DB::beginTransaction();

        try {
            // 2. Criar o User com os dados fornecidos
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'revendedor',
                'status' => 'pending_email_validation',
            ]);

            // 3. Guardar o ficheiro do alvará com nome único
            $alvaraFile = $request->file('alvara');
            $originalExtension = $alvaraFile->getClientOriginalExtension();
            $alvaraFileName = 'alvara_' . $user->id . '_' . Str::random(10) . '.' . $originalExtension;
            
            // Criar diretório se não existir
            if (!Storage::disk('local')->exists('alvaras')) {
                Storage::disk('local')->makeDirectory('alvaras');
            }
            
            $alvaraPath = $alvaraFile->storeAs('alvaras', $alvaraFileName, 'local');

            // 4. Criar o RevendedorProfile associado
            RevendedorProfile::create([
                'user_id' => $user->id,
                'company_name' => $validated['company_name'],
                'phone_number' => $validated['phone_number'],
                'alvara_path' => $alvaraPath,
            ]);

            // 5. Disparar o evento Registered para envio de email de verificação
            event(new Registered($user));

            // 6. Confirmar a transação
            DB::commit();

            // 7. Retornar resposta JSON com sucesso
            return response()->json([
                'message' => 'Registro realizado com sucesso! Verifique seu email para ativar a conta.',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'status' => $user->status,
                ],
            ], 201);

        } catch (\Exception $e) {
            // Reverter a transação em caso de erro
            DB::rollBack();
            
            // Log do erro para debugging
            \Log::error('Erro no registro de revendedor: ' . $e->getMessage(), [
                'email' => $validated['email'] ?? 'N/A',
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Erro durante o registro. Tente novamente.',
                'error' => config('app.debug') ? $e->getMessage() : 'Erro interno do servidor',
            ], 500);
        }
    }
}
