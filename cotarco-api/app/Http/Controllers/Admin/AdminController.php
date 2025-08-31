<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdatePartnerStatusRequest;
use App\Models\User;
use App\Mail\RevendedorApproved;
use App\Mail\RevendedorRejected;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class AdminController extends Controller
{
    /**
     * Constructor - aplicar middleware de autenticação e admin apenas para métodos específicos
     */
    public function __construct()
    {
        $this->middleware(['auth:sanctum', 'admin'])->except(['downloadAlvara']);
    }

    /**
     * Listar revendedores com filtros opcionais
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $query = User::with('partnerProfile')
                ->whereIn('role', ['revendedor', 'distribuidor'])
                ->where('status', '!=', 'pending_email_validation'); // Regra de segurança

            // Filtrar por status se fornecido
            $status = $request->query('status');
            if ($status) {
                $query->where('status', $status);
            } else {
                // Se nenhum status fornecido, retorna apenas os pendentes por padrão
                $query->where('status', 'pending_approval');
            }

            // Filtrar por role se fornecido
            $role = $request->query('role');
            if ($role && in_array($role, ['revendedor', 'distribuidor'])) {
                $query->where('role', $role);
            }

            // Paginação
            $perPage = $request->query('per_page', 15);
            $partners = $query->paginate($perPage);

            // Mapear os dados
            $partners->getCollection()->transform(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                    'profile' => $user->partnerProfile ? [
                        'company_name' => $user->partnerProfile->company_name,
                        'phone_number' => $user->partnerProfile->phone_number,
                        'business_model' => $user->partnerProfile->business_model,
                        'alvara_path' => $user->partnerProfile->alvara_path,
                    ] : [
                        'company_name' => 'Não informado',
                        'phone_number' => 'Não informado',
                        'business_model' => null,
                        'alvara_path' => null,
                    ],
                ];
            });

            return response()->json([
                'message' => 'Parceiros listados com sucesso.',
                'data' => $partners->items(),
                'pagination' => [
                    'current_page' => $partners->currentPage(),
                    'per_page' => $partners->perPage(),
                    'total' => $partners->total(),
                    'last_page' => $partners->lastPage(),
                    'from' => $partners->firstItem(),
                    'to' => $partners->lastItem(),
                ],
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao obter parceiros.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Listar todos os revendedores pendentes de aprovação
     * @deprecated Use index() method instead
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPendingRevendedores()
    {
        try {
            $pendingPartners = User::with('partnerProfile')
                ->whereIn('role', ['revendedor', 'distribuidor'])
                ->where('status', 'pending_approval')
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                        'status' => $user->status,
                        'created_at' => $user->created_at,
                        'profile' => $user->partnerProfile ? [
                            'company_name' => $user->partnerProfile->company_name,
                            'phone_number' => $user->partnerProfile->phone_number,
                            'business_model' => $user->partnerProfile->business_model,
                            'alvara_path' => $user->partnerProfile->alvara_path,
                        ] : [
                            'company_name' => 'Não informado',
                            'phone_number' => 'Não informado',
                            'business_model' => null,
                            'alvara_path' => null,
                        ],
                    ];
                });

            return response()->json([
                'message' => 'Parceiros pendentes listados com sucesso.',
                'data' => $pendingPartners,
                'total' => $pendingPartners->count(),
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao obter parceiros pendentes.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Aprovar um revendedor
     *
     * @param  \App\Models\User  $user
     * @return \Illuminate\Http\JsonResponse
     */
    public function approveRevendedor(User $user)
    {
        // Verificar se o usuário é revendedor
        if ($user->role !== 'revendedor') {
            return response()->json([
                'message' => 'Este usuário não é um revendedor.',
            ], 400);
        }

        // Verificar se está pendente de aprovação
        if ($user->status !== 'pending_approval') {
            return response()->json([
                'message' => 'Este revendedor não está pendente de aprovação.',
                'current_status' => $user->status,
            ], 400);
        }

        // Alterar status para 'active'
        $user->update(['status' => 'active']);

        // Enviar email de aprovação
        $loginUrl = env('FRONTEND_URL', 'http://localhost:5173') . '/login';
        
        try {
            Mail::to($user->email)->send(new RevendedorApproved($user, $loginUrl));
            
            return response()->json([
                'message' => 'Revendedor aprovado com sucesso. Email de notificação enviado.',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                ],
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Revendedor aprovado, mas houve erro no envio do email.',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                ],
                'email_error' => $e->getMessage(),
            ], 200);
        }
    }

    /**
     * Visualizar/baixar alvará de um revendedor
     *
     * @param  \App\Models\User  $user
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function downloadAlvara(User $user, Request $request)
    {
        // Verificar autenticação via token na query string
        $token = $request->query('token');
        if (!$token) {
            return response()->json(['message' => 'Token não fornecido.'], 401);
        }

        // Buscar o token no banco de dados
        $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
        if (!$accessToken) {
            return response()->json(['message' => 'Token inválido.'], 401);
        }

        // Verificar se o usuário é admin
        $authUser = $accessToken->tokenable;
        if (!$authUser || $authUser->role !== 'admin') {
            return response()->json(['message' => 'Acesso negado. Apenas administradores podem acessar este recurso.'], 403);
        }

        // Verificar se o usuário é revendedor
        if ($user->role !== 'revendedor') {
            return response()->json([
                'message' => 'Este usuário não é um revendedor.',
            ], 400);
        }

        // Obter o perfil do revendedor
        $profile = $user->partnerProfile;
        if (!$profile || !$profile->alvara_path) {
            return response()->json([
                'message' => 'Alvará não encontrado para este revendedor.',
            ], 404);
        }

        // Verificar se o arquivo existe
        if (!Storage::disk('local')->exists($profile->alvara_path)) {
            return response()->json([
                'message' => 'Arquivo do alvará não encontrado no servidor.',
            ], 404);
        }

        try {
            // Obter informações do arquivo
            $filePath = $profile->alvara_path;
            $fileName = basename($filePath);
            $mimeType = Storage::disk('local')->mimeType($filePath);
            
            // Retornar o arquivo
            return response()->file(
                Storage::disk('local')->path($filePath),
                [
                    'Content-Type' => $mimeType,
                    'Content-Disposition' => 'inline; filename="' . $fileName . '"'
                ]
            );
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao acessar o arquivo do alvará.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Rejeitar um revendedor
     *
     * @param  \App\Models\User  $user
     * @return \Illuminate\Http\JsonResponse
     */
    public function rejectRevendedor(User $user)
    {
        // Verificar se o usuário é revendedor
        if ($user->role !== 'revendedor') {
            return response()->json([
                'message' => 'Este usuário não é um revendedor.',
            ], 400);
        }

        // Verificar se está pendente de aprovação
        if ($user->status !== 'pending_approval') {
            return response()->json([
                'message' => 'Este revendedor não está pendente de aprovação.',
                'current_status' => $user->status,
            ], 400);
        }

        // Alterar status para 'rejected'
        $user->update(['status' => 'rejected']);

        // Enviar email de rejeição
        try {
            Mail::to($user->email)->send(new RevendedorRejected($user));
            
            return response()->json([
                'message' => 'Revendedor rejeitado com sucesso. Email de notificação enviado.',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                ],
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Revendedor rejeitado, mas houve erro no envio do email.',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                ],
                'email_error' => $e->getMessage(),
            ], 200);
        }
    }

    /**
     * Atualizar status de um parceiro (revendedor ou distribuidor) de forma genérica
     *
     * @param  \App\Http\Requests\UpdatePartnerStatusRequest  $request
     * @param  \App\Models\User  $user
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateStatus(UpdatePartnerStatusRequest $request, User $user)
    {
        // Verificar se o usuário é revendedor ou distribuidor
        if (!in_array($user->role, ['revendedor', 'distribuidor'])) {
            return response()->json([
                'message' => 'Este usuário não é um parceiro válido (revendedor ou distribuidor).',
            ], 400);
        }

        // O status já foi validado pelo Form Request
        $validatedData = $request->validated();

        $newStatus = $validatedData['status'];
        $oldStatus = $user->status;

        // Verificar se o status realmente mudou
        if ($oldStatus === $newStatus) {
            return response()->json([
                'message' => 'O status do revendedor já é ' . $newStatus . '.',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                ],
            ], 200);
        }

        // Atualizar o status
        $user->update(['status' => $newStatus]);

        // Enviar notificações por email baseadas no novo status
        $emailSent = false;
        $emailError = null;

        try {
            if ($newStatus === 'active') {
                // Enviar email de aprovação
                $loginUrl = env('FRONTEND_URL', 'http://localhost:5173') . '/login';
                Mail::to($user->email)->send(new RevendedorApproved($user, $loginUrl));
                $emailSent = true;
            } elseif ($newStatus === 'rejected') {
                // Enviar email de rejeição
                Mail::to($user->email)->send(new RevendedorRejected($user));
                $emailSent = true;
            }
        } catch (\Exception $e) {
            $emailError = $e->getMessage();
        }

        // Preparar resposta
        $response = [
            'message' => 'Status do parceiro atualizado com sucesso.',
            'user' => [
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
     * Obter estatísticas do dashboard administrativo
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getDashboardStats()
    {
        try {
            // Contar parceiros por status (excluindo pending_email_validation)
            $pendingCount = User::whereIn('role', ['revendedor', 'distribuidor'])
                ->where('status', 'pending_approval')
                ->count();

            $activeCount = User::whereIn('role', ['revendedor', 'distribuidor'])
                ->where('status', 'active')
                ->count();

            $rejectedCount = User::whereIn('role', ['revendedor', 'distribuidor'])
                ->where('status', 'rejected')
                ->count();

            $inactiveCount = User::whereIn('role', ['revendedor', 'distribuidor'])
                ->where('status', 'inactive')
                ->count();

            // Contar por tipo de parceiro
            $revendedoresCount = User::where('role', 'revendedor')
                ->where('status', '!=', 'pending_email_validation')
                ->count();

            $distribuidoresCount = User::where('role', 'distribuidor')
                ->where('status', '!=', 'pending_email_validation')
                ->count();

            // Estatísticas adicionais (placeholder para futuras funcionalidades)
            $totalSalesThisMonth = 0; // Placeholder
            $activeOrdersCount = 0;   // Placeholder

            return response()->json([
                'message' => 'Estatísticas obtidas com sucesso.',
                'data' => [
                    'parceiros' => [
                        'pending_approval' => $pendingCount,
                        'active' => $activeCount,
                        'rejected' => $rejectedCount,
                        'inactive' => $inactiveCount,
                        'total' => $pendingCount + $activeCount + $rejectedCount + $inactiveCount,
                    ],
                    'por_tipo' => [
                        'revendedores' => $revendedoresCount,
                        'distribuidores' => $distribuidoresCount,
                    ],
                    'sales' => [
                        'total_this_month' => $totalSalesThisMonth,
                    ],
                    'orders' => [
                        'active_count' => $activeOrdersCount,
                    ],
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao obter estatísticas do dashboard.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
