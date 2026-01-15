<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\PartnerProfile;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\PartnerApproved;
use App\Mail\PartnerRejected;

class PartnerController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct()
    {
        $this->middleware(['auth:sanctum', 'admin']);
    }

    /**
     * Display a listing of partners.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with('partnerProfile')
            ->where(function($q) {
                $q->whereIn('role', ['revendedor', 'distribuidor'])
                  ->orWhereNull('role');
            });

        // Filtros
        if ($request->has('role') && in_array($request->role, ['revendedor', 'distribuidor'])) {
            $query->where('role', $request->role);
        } elseif ($request->has('role') && $request->role === 'null') {
            $query->whereNull('role');
        }
        
        if ($request->has('status') && in_array($request->status, ['pending_approval', 'active', 'rejected', 'inactive', 'suspended'])) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhereHas('partnerProfile', function ($profileQuery) use ($search) {
                      $profileQuery->where('company_name', 'like', "%{$search}%");
                  });
            });
        }

        $partners = $query->paginate($request->get('per_page', 15));

        \Illuminate\Support\Facades\Log::info('Consulta de Parceiros:', [
            'status_recebido' => $request->input('status'),
            'sql_gerado' => $query->toSql(),
            'bindings' => $query->getBindings()
        ]);

        // Mapear os dados para incluir user_id
        $partners->getCollection()->transform(function ($user) {
            $transformed = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
                'partner_profile' => null
            ];
            
            if ($user->partnerProfile) {
                $transformed['partner_profile'] = [
                    'id' => $user->partnerProfile->id,
                    'user_id' => $user->partnerProfile->user_id,
                    'company_name' => $user->partnerProfile->company_name,
                    'phone_number' => $user->partnerProfile->phone_number,
                    'business_model' => $user->partnerProfile->business_model,
                    'discount_percentage' => $user->partnerProfile->discount_percentage,
                    'alvara_path' => $user->partnerProfile->alvara_path
                ];
            }
            

            
            return $transformed;
        });

        return response()->json([
            'partners' => $partners->items(),
            'pagination' => [
                'current_page' => $partners->currentPage(),
                'last_page' => $partners->lastPage(),
                'per_page' => $partners->perPage(),
                'total' => $partners->total(),
            ]
        ]);
    }

    /**
     * Display the specified partner.
     */
    public function show(User $partner): JsonResponse
    {
        $partner->load('partnerProfile');

        if (!in_array($partner->role, ['revendedor', 'distribuidor']) && $partner->role !== null) {
            return response()->json(['message' => 'Utilizador não é um parceiro.'], 404);
        }

        return response()->json([
            'partner' => $partner
        ]);
    }

    /**
     * Update the specified partner.
     */
    public function update(Request $request, User $user): JsonResponse
    {
        // Validar os campos recebidos
        $validated = $request->validate([
            'business_model' => 'sometimes|string|in:B2B,B2C',
            'discount_percentage' => 'sometimes|numeric|min:0|max:100',
        ]);

        // Verificar se o usuário é um parceiro (revendedor, distribuidor ou null - não classificado)
        if (!in_array($user->role, ['revendedor', 'distribuidor']) && $user->role !== null) {
            return response()->json(['message' => 'Utilizador não é um parceiro.'], 404);
        }

        // Iniciar transação para garantir consistência
        DB::beginTransaction();

        try {
            // Atualizar o business_model no perfil associado se fornecido
            if ($request->has('business_model')) {
                $user->partnerProfile()->update([
                    'business_model' => $request->input('business_model')
                ]);
            }

            // Atualizar a discount_percentage no perfil se fornecida
            if ($request->has('discount_percentage')) {
                $user->partnerProfile()->update([
                    'discount_percentage' => $request->input('discount_percentage')
                ]);
            }

            // Confirmar a transação
            DB::commit();

            // Recarregar o usuário com o perfil atualizado
            $user->load('partnerProfile');

            return response()->json([
                'message' => 'Parceiro atualizado com sucesso.',
                'partner' => $user
            ], 200);

        } catch (\Exception $e) {
            // Reverter a transação em caso de erro
            DB::rollBack();
            
            \Log::error('Erro ao atualizar parceiro: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Erro ao atualizar parceiro. Tente novamente.',
                'error' => config('app.debug') ? $e->getMessage() : 'Erro interno do servidor',
            ], 500);
        }
    }

    /**
     * Update the specified partner's status.
     * Absorve a lógica dos métodos approveRevendedor e rejectRevendedor do AdminController.
     */
    public function updateStatus(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:active,suspended,pending_approval,rejected,inactive'
        ]);
    
        // Verificar se o usuário é um parceiro (revendedor, distribuidor ou null - não classificado)
        if (!in_array($user->role, ['revendedor', 'distribuidor']) && $user->role !== null) {
            return response()->json([
                'message' => 'Este usuário não é um parceiro válido.',
            ], 400);
        }

        $oldStatus = $user->status;
        $newStatus = $validated['status'];

        // Verificar se o status realmente mudou
        if ($oldStatus === $newStatus) {
            return response()->json([
                'message' => 'O status do parceiro já é ' . $newStatus . '.',
                'partner' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                ],
            ], 200);
        }

        // Validações específicas para aprovação e rejeição (lógica dos métodos antigos)
        if ($newStatus === 'active' && !in_array($oldStatus, ['pending_approval', 'inactive', 'suspended'])) {
            return response()->json([
                'message' => 'Este parceiro não pode ser ativado. Status atual: ' . $oldStatus,
                'current_status' => $user->status,
            ], 400);
        }

        if ($newStatus === 'rejected' && $oldStatus !== 'pending_approval') {
            return response()->json([
                'message' => 'Este parceiro não está pendente de aprovação.',
                'current_status' => $user->status,
            ], 400);
        }
    
        // Atualizar o status
        $user->update(['status' => $newStatus]);
    
        // Lógica de notificação por email (absorvida dos métodos antigos)
        $emailSent = false;
        $emailError = null;
        $loginUrl = env('FRONTEND_URL', 'http://localhost:5173') . '/login';

        try {
            if ($newStatus === 'active' && $oldStatus !== 'active') {
                // Se o estado anterior era inativo/rejeitado, é uma reativação
                if ($oldStatus === 'inactive' || $oldStatus === 'rejected') {
                    Mail::to($user->email)->send(new \App\Mail\PartnerReactivated($user, $loginUrl));
                } else { // Senão, é a primeira aprovação
                    Mail::to($user->email)->send(new \App\Mail\PartnerApproved($user, $loginUrl));
                }
                $emailSent = true;
            } elseif ($newStatus === 'rejected') {
                Mail::to($user->email)->send(new \App\Mail\PartnerRejected($user));
                $emailSent = true;
            } elseif ($newStatus === 'inactive') {
                Mail::to($user->email)->send(new \App\Mail\PartnerDeactivated($user));
                $emailSent = true;
            }
        } catch (\Exception $e) {
            $emailError = $e->getMessage();
        }

        // Preparar resposta
        $response = [
            'message' => 'Status do parceiro atualizado com sucesso.',
            'partner' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status,
                'previous_status' => $oldStatus,
            ],
        ];

        // Adicionar informações sobre o email se aplicável
        if ($emailSent && !$emailError) {
            $response['message'] .= ' Email de notificação enviado.';
        } elseif ($emailSent && $emailError) {
            $response['message'] .= ' Porém, houve erro no envio do email.';
            $response['email_error'] = $emailError;
        }
    
        return response()->json($response, 200);
    }

    /**
     * Update partner profile information.
     */
    public function updateProfile(Request $request, User $partner): JsonResponse
    {
        $validated = $request->validate([
            'company_name' => 'sometimes|string|max:255',
            'phone_number' => 'sometimes|string|max:20',
            'business_model' => 'sometimes|in:B2B,B2C',
        ]);

        if (!in_array($partner->role, ['revendedor', 'distribuidor']) && $partner->role !== null) {
            return response()->json(['message' => 'Utilizador não é um parceiro.'], 404);
        }

        if ($partner->partnerProfile) {
            $partner->partnerProfile->update($validated);
        }

        return response()->json([
            'message' => 'Perfil do parceiro atualizado com sucesso.',
            'partner' => $partner->fresh()->load('partnerProfile')
        ]);
    }

    /**
     * Get partner statistics.
     */
    public function statistics(): JsonResponse
    {
        $stats = DB::table('users')
            ->selectRaw('
                COALESCE(role, "null") as role,
                status,
                COUNT(*) as count
            ')
            ->where(function($q) {
                $q->whereIn('role', ['revendedor', 'distribuidor'])
                  ->orWhereNull('role');
            })
            ->groupBy('role', 'status')
            ->get()
            ->groupBy('role');

        $totalPartners = User::where(function($q) {
            $q->whereIn('role', ['revendedor', 'distribuidor'])
              ->orWhereNull('role');
        })->count();
        
        $activePartners = User::where(function($q) {
            $q->whereIn('role', ['revendedor', 'distribuidor'])
              ->orWhereNull('role');
        })->where('status', 'active')->count();

        return response()->json([
            'total_partners' => $totalPartners,
            'active_partners' => $activePartners,
            'by_role' => $stats,
        ]);
    }

    /**
     * Visualizar/baixar alvará de um parceiro
     * 
     * A autenticação é garantida pelo middleware 'auth:sanctum' e 'admin' 
     * aplicado na rota, eliminando a necessidade de validação manual de token.
     *
     * @param  \App\Models\User  $user
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function downloadAlvara(User $user, Request $request)
    {
        // Verificar se o usuário é um parceiro (revendedor, distribuidor ou null - não classificado)
        if (!in_array($user->role, ['revendedor', 'distribuidor']) && $user->role !== null) {
            return response()->json([
                'message' => 'Este usuário não é um parceiro.',
            ], 400);
        }

        // Obter o perfil do parceiro
        $profile = $user->partnerProfile;
        if (!$profile || !$profile->alvara_path) {
            return response()->json([
                'message' => 'Alvará não encontrado para este parceiro.',
            ], 404);
        }

        // Verificar se o arquivo existe
        if (!Storage::disk('local')->exists($profile->alvara_path)) {
            return response()->json([
                'message' => 'Arquivo do alvará não encontrado no servidor.',
            ], 404);
        }

        try {
            // Obter o caminho completo do arquivo
            $filePath = $profile->alvara_path;
            $fileName = basename($filePath);
            
            // Detectar o tipo MIME baseado na extensão do arquivo
            $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            $mimeType = match($extension) {
                'pdf' => 'application/pdf',
                'jpg', 'jpeg' => 'image/jpeg',
                'png' => 'image/png',
                'gif' => 'image/gif',
                'bmp' => 'image/bmp',
                'webp' => 'image/webp',
                default => 'application/octet-stream'
            };
            
            // Obter o conteúdo do arquivo
            $fileContent = Storage::disk('local')->get($filePath);
            
            // Retornar o arquivo com o Content-Type correto
            return response($fileContent, 200, [
                'Content-Type' => $mimeType,
                'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
                'Content-Length' => strlen($fileContent)
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Erro ao baixar alvará: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'file_path' => $profile->alvara_path ?? 'N/A'
            ]);
            
            return response()->json([
                'message' => 'Erro ao baixar o alvará. Tente novamente.',
            ], 500);
        }
    }
}
