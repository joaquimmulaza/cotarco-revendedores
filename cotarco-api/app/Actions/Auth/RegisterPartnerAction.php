<?php

namespace App\Actions\Auth;

use App\Models\User;
use App\Models\PartnerProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class RegisterPartnerAction
{
    /**
     * Execute the partner registration action.
     *
     * @param array $validatedData
     * @param Request $request
     * @return array
     * @throws \Exception
     */
    public function execute(array $validatedData, Request $request): array
    {
        // Iniciar transação de base de dados
        DB::beginTransaction();

        try {
            // 1. Criar o User com os dados fornecidos
            $user = User::create([
                'name' => $validatedData['name'],
                'email' => $validatedData['email'],
                'password' => Hash::make($validatedData['password']),
                'role' => null,
                'status' => 'pending_email_validation',
            ]);

            // 2. Guardar o ficheiro do alvará com nome único
            $alvaraFile = $request->file('alvara');
            $originalExtension = $alvaraFile->getClientOriginalExtension();
            $alvaraFileName = 'alvara_' . $user->id . '_' . Str::random(10) . '.' . $originalExtension;
            
            // Criar diretório se não existir
            if (!Storage::disk('local')->exists('alvaras')) {
                Storage::disk('local')->makeDirectory('alvaras');
            }
            
            $alvaraPath = $alvaraFile->storeAs('alvaras', $alvaraFileName, 'local');

            // 3. Criar o PartnerProfile associado
            PartnerProfile::create([
                'user_id' => $user->id,
                'company_name' => $validatedData['company_name'],
                'phone_number' => $validatedData['phone_number'],
                'alvara_path' => $alvaraPath,
            ]);

            // 4. Disparar o evento Registered para envio de email de verificação
            event(new Registered($user));

            // 5. Confirmar a transação
            DB::commit();

            // 6. Retornar dados do usuário criado
            return [
                'user' => $user,
                'message' => 'Registro realizado com sucesso! Verifique seu email para ativar a conta.'
            ];

        } catch (\Exception $e) {
            // Reverter a transação em caso de erro
            DB::rollBack();
            
            // Log do erro para debugging
            Log::error('Erro no registro de parceiro: ' . $e->getMessage(), [
                'email' => $validatedData['email'] ?? 'N/A',
                'trace' => $e->getTraceAsString()
            ]);

            throw $e;
        }
    }
}
