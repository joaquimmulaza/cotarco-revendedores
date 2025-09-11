<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * Constructor - aplicar middleware de autenticação e admin apenas para métodos específicos
     */
    public function __construct()
    {
        $this->middleware(['auth:sanctum', 'admin']);
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
     * Listar todos os parceiros pendentes de aprovação
     * @deprecated Use index() method instead
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPendingPartners()
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
     * Obter estatísticas do dashboard administrativo
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getDashboardStats()
    {
        try {
            // Contar parceiros por status (excluindo pending_email_validation)
            // Incluir utilizadores com role null (não classificados) e role revendedor/distribuidor
            $pendingCount = User::where(function($q) {
                $q->whereIn('role', ['revendedor', 'distribuidor'])
                  ->orWhereNull('role');
            })
                ->where('status', 'pending_approval')
                ->count();

            $activeCount = User::where(function($q) {
                $q->whereIn('role', ['revendedor', 'distribuidor'])
                  ->orWhereNull('role');
            })
                ->where('status', 'active')
                ->count();

            $rejectedCount = User::where(function($q) {
                $q->whereIn('role', ['revendedor', 'distribuidor'])
                  ->orWhereNull('role');
            })
                ->where('status', 'rejected')
                ->count();

            $inactiveCount = User::where(function($q) {
                $q->whereIn('role', ['revendedor', 'distribuidor'])
                  ->orWhereNull('role');
            })
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
