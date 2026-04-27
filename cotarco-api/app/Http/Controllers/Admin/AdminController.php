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
     * Listar parceiros com filtros opcionais
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $query = User::with('partnerProfile')
                ->where('role', 'distribuidor')
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
            if ($role && $role === 'distribuidor') {
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
                ->where('role', 'distribuidor')
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
            // Incluir utilizadores com role null (não classificados) e role distribuidor
            $pendingCount = User::where(function($q) {
                $q->where('role', 'distribuidor')
                  ->orWhereNull('role');
            })
                ->where('status', 'pending_approval')
                ->count();

            $activeCount = User::where(function($q) {
                $q->where('role', 'distribuidor')
                  ->orWhereNull('role');
            })
                ->where('status', 'active')
                ->count();

            $rejectedCount = User::where(function($q) {
                $q->where('role', 'distribuidor')
                  ->orWhereNull('role');
            })
                ->where('status', 'rejected')
                ->count();

            $inactiveCount = User::where(function($q) {
                $q->where('role', 'distribuidor')
                  ->orWhereNull('role');
            })
                ->where('status', 'inactive')
                ->count();

            // Contar por tipo de parceiro
            $b2bCount = User::where('role', 'distribuidor')
                ->where('status', '!=', 'pending_email_validation')
                ->whereHas('partnerProfile', function($query) {
                    $query->where('business_model', 'b2b')->orWhere('business_model', 'B2B');
                })
                ->count();

            $b2cCount = User::where('role', 'distribuidor')
                ->where('status', '!=', 'pending_email_validation')
                ->whereHas('partnerProfile', function($query) {
                    $query->where('business_model', 'b2c')->orWhere('business_model', 'B2C');
                })
                ->count();

            // Estatísticas reais de vendas e encomendas
            $totalSales = \App\Models\Order::whereIn('status', ['paid', 'completed', 'processing'])->sum('total_amount');
            $ordersCount = \App\Models\Order::whereIn('status', ['paid', 'completed', 'processing'])->count();
            $aov = $ordersCount > 0 ? $totalSales / $ordersCount : 0;

            // Vendas este mês
            $totalSalesThisMonth = \App\Models\Order::whereIn('status', ['paid', 'completed', 'processing'])
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('total_amount');

            // Encomendas ativas (pendentes de pagamento ou processamento)
            $activeOrdersCount = \App\Models\Order::whereIn('status', ['pending', 'processing'])->count();

            // === NOVOS CAMPOS: revenue_by_month e partner_funnel ===

            // 1. revenue_by_month (Últimos 6 meses)
            $sixMonthsAgo = now()->subMonths(5)->startOfMonth();
            $ordersForRevenue = \App\Models\Order::with('user.partnerProfile')
                ->whereIn('status', ['paid', 'success', 'completed'])
                ->where('created_at', '>=', $sixMonthsAgo)
                ->get();

            $revenueByMonth = collect();
            for ($i = 5; $i >= 0; $i--) {
                $monthDate = now()->subMonths($i);
                $monthStr = $monthDate->format('Y-m');
                
                $monthOrders = $ordersForRevenue->filter(function($order) use ($monthStr) {
                    return $order->created_at->format('Y-m') === $monthStr;
                });

                $b2b = $monthOrders->filter(function($order) {
                    return optional(optional($order->user)->partnerProfile)->business_model === 'b2b';
                })->sum('total_amount');

                $b2c = $monthOrders->filter(function($order) {
                    return optional(optional($order->user)->partnerProfile)->business_model === 'b2c';
                })->sum('total_amount');

                $revenueByMonth->push([
                    'month' => $monthStr,
                    'b2b' => (float)$b2b,
                    'b2c' => (float)$b2c,
                ]);
            }

            // 2. partner_funnel
            $registeredCount = User::where(function($q) {
                $q->where('role', 'distribuidor')
                  ->orWhereNull('role');
            })->count();

            $emailVerifiedCount = User::where(function($q) {
                $q->where('role', 'distribuidor')
                  ->orWhereNull('role');
            })->whereNotNull('email_verified_at')->count();

            $withOrdersCount = User::where(function($q) {
                $q->where('role', 'distribuidor')
                  ->orWhereNull('role');
            })->whereHas('orders')->count();

            // 3. recent_orders
            $recentOrders = \App\Models\Order::with('user')->orderBy('created_at', 'desc')->take(5)->get();

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
                        'b2b' => $b2bCount,
                        'b2c' => $b2cCount,
                    ],
                    'sales' => [
                        'total_revenue' => (float) $totalSales,
                        'total_this_month' => (float) $totalSalesThisMonth,
                        'average_order_value' => (float) $aov,
                    ],
                    'orders' => [
                        'total_count' => $ordersCount,
                        'active_count' => $activeOrdersCount,
                    ],
                    'revenue_by_month' => $revenueByMonth,
                    'partner_funnel' => [
                        'registered' => $registeredCount,
                        'email_verified' => $emailVerifiedCount,
                        'pending_approval' => $pendingCount,
                        'active' => $activeCount,
                        'with_orders' => $withOrdersCount,
                    ],
                    'recent_orders' => $recentOrders,
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
