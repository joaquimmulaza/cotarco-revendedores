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
        \Illuminate\Support\Facades\Log::info('APP_URL a ser usado:', ['url' => config('app.url')]);
        
        // Iniciar transação de base de dados
        DB::beginTransaction();

        try {
            // 1. Criar o User com os dados fornecidos
            $user = User::create([
                'name' => $validatedData['name'],
                'email' => $validatedData['email'],
                'password' => Hash::make($validatedData['password']),
                'role' => 'distribuidor',
                'status' => 'pending_email_validation',
            ]);

            Log::info('Usuário criado com sucesso', ['user_id' => $user->id, 'email' => $user->email]);

            // 2. Guardar o ficheiro do alvará com nome único
            $alvaraFile = $request->file('alvara');
            $originalExtension = $alvaraFile->getClientOriginalExtension();
            $alvaraFileName = 'alvara_' . $user->id . '_' . Str::random(10) . '.' . $originalExtension;
            
            // Criar diretório se não existir com verificação de permissões
            $alvarasDir = 'alvaras';
            if (!Storage::disk('local')->exists($alvarasDir)) {
                try {
                    Storage::disk('local')->makeDirectory($alvarasDir);
                    Log::info('Diretório alvaras criado com sucesso');
                } catch (\Exception $e) {
                    Log::error('Erro ao criar diretório alvaras', ['error' => $e->getMessage()]);
                    throw new \Exception('Erro ao criar diretório para armazenamento de arquivos: ' . $e->getMessage());
                }
            }
            
            // Verificar se o diretório foi criado com sucesso
            if (!Storage::disk('local')->exists($alvarasDir)) {
                throw new \Exception('Não foi possível criar o diretório para armazenamento de arquivos');
            }
            
            $alvaraPath = $alvaraFile->storeAs($alvarasDir, $alvaraFileName, 'local');
            
            // Verificar se o arquivo foi armazenado com sucesso
            if (!$alvaraPath || !Storage::disk('local')->exists($alvaraPath)) {
                throw new \Exception('Erro ao armazenar arquivo do alvará');
            }
            
            Log::info('Arquivo do alvará armazenado com sucesso', ['path' => $alvaraPath]);

            // 3. Criar o PartnerProfile associado
            $partnerProfile = PartnerProfile::create([
                'user_id' => $user->id,
                'company_name' => $validatedData['company_name'],
                'phone_number' => $validatedData['phone_number'],
                'alvara_path' => $alvaraPath,
            ]);

            // Verificar se o PartnerProfile foi criado com sucesso
            if (!$partnerProfile || !$partnerProfile->exists) {
                throw new \Exception('Erro ao criar perfil do parceiro');
            }
            
            Log::info('PartnerProfile criado com sucesso', ['profile_id' => $partnerProfile->id, 'user_id' => $user->id]);

            // 4. Disparar o evento Registered para envio de email de verificação
            event(new Registered($user));
            Log::info('Evento de registro disparado', ['user_id' => $user->id]);

            // 5. Confirmar a transação
            DB::commit();
            Log::info('Transação confirmada com sucesso', ['user_id' => $user->id]);

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
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            // Se o usuário foi criado mas houve erro posterior, tentar limpar
            if (isset($user) && $user->exists) {
                try {
                    // Verificar se existe PartnerProfile e deletar se necessário
                    $existingProfile = PartnerProfile::where('user_id', $user->id)->first();
                    if ($existingProfile) {
                        $existingProfile->delete();
                        Log::info('PartnerProfile removido devido a erro', ['user_id' => $user->id]);
                    }
                    
                    // Deletar arquivo se foi criado
                    if (isset($alvaraPath) && Storage::disk('local')->exists($alvaraPath)) {
                        Storage::disk('local')->delete($alvaraPath);
                        Log::info('Arquivo do alvará removido devido a erro', ['path' => $alvaraPath]);
                    }
                    
                    // Deletar usuário
                    $user->delete();
                    Log::info('Usuário removido devido a erro', ['user_id' => $user->id]);
                } catch (\Exception $cleanupError) {
                    Log::error('Erro durante limpeza após falha no registro', [
                        'original_error' => $e->getMessage(),
                        'cleanup_error' => $cleanupError->getMessage()
                    ]);
                }
            }

            throw $e;
        }
    }
}
