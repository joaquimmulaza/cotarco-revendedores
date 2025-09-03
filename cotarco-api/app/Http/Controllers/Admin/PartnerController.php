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
            ->whereIn('role', ['revendedor', 'distribuidor']);

        // Filtros
        if ($request->has('role') && in_array($request->role, ['revendedor', 'distribuidor'])) {
            $query->where('role', $request->role);
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

        // Mapear os dados para incluir user_id
        $partners->getCollection()->transform(function ($user) {
            $transformed = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status,
                'partner_profile' => null
            ];
            
            if ($user->partnerProfile) {
                $transformed['partner_profile'] = [
                    'id' => $user->partnerProfile->id,
                    'user_id' => $user->partnerProfile->user_id,
                    'company_name' => $user->partnerProfile->company_name,
                    'phone_number' => $user->partnerProfile->phone_number,
                    'business_model' => $user->partnerProfile->business_model,
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

        if (!in_array($partner->role, ['revendedor', 'distribuidor'])) {
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
            'role' => 'required|in:revendedor,distribuidor',
            'business_model' => 'required|in:B2B,B2C',
        ]);

        // Verificar se o usuário é um parceiro
        if (!in_array($user->role, ['revendedor', 'distribuidor'])) {
            return response()->json(['message' => 'Utilizador não é um parceiro.'], 404);
        }

        // Iniciar transação para garantir consistência
        DB::beginTransaction();

        try {
            // Atualizar o role do usuário
            $user->update(['role' => $validated['role']]);

            // Atualizar o business_model no perfil associado
            if ($user->partnerProfile) {
                $user->partnerProfile->update(['business_model' => $validated['business_model']]);
            } else {
                // Se não existir perfil, criar um básico
                PartnerProfile::create([
                    'user_id' => $user->id,
                    'business_model' => $validated['business_model'],
                    'company_name' => $user->name, // Valor padrão
                    'phone_number' => '', // Valor padrão
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
     */
    public function updateStatus(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:active,suspended,pending_email_validation,pending_approval,rejected,inactive'
        ]);
    
        // A verificação agora usa $user, que será o modelo correto injetado pelo Laravel
        if (!in_array($user->role, ['revendedor', 'distribuidor'])) {
            return response()->json(['message' => 'Utilizador não é um parceiro.'], 404);
        }
    
        $user->update(['status' => $validated['status']]);
    
        // Enviar email de notificação baseado no status
        if ($validated['status'] === 'active') {
            $loginUrl = env('FRONTEND_URL', 'http://localhost:5173') . '/login';
            Mail::to($user->email)->send(new PartnerApproved($user, $loginUrl));
        } elseif ($validated['status'] === 'rejected') {
            Mail::to($user->email)->send(new PartnerRejected($user));
        }
    
        return response()->json([
            'message' => 'Status do parceiro atualizado com sucesso.',
            'partner' => $user->fresh()->load('partnerProfile')
        ]);
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

        if (!in_array($partner->role, ['revendedor', 'distribuidor'])) {
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
                role,
                status,
                COUNT(*) as count
            ')
            ->whereIn('role', ['revendedor', 'distribuidor'])
            ->groupBy('role', 'status')
            ->get()
            ->groupBy('role');

        $totalPartners = User::whereIn('role', ['revendedor', 'distribuidor'])->count();
        $activePartners = User::whereIn('role', ['revendedor', 'distribuidor'])
            ->where('status', 'active')
            ->count();

        return response()->json([
            'total_partners' => $totalPartners,
            'active_partners' => $activePartners,
            'by_role' => $stats,
        ]);
    }

    /**
     * Visualizar/baixar alvará de um parceiro
     *
     * @param  \App\Models\User  $user
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function downloadAlvara(User $user, Request $request)
    {
        // A autenticação é feita automaticamente pelo middleware 'admin'
        // que já verifica se o usuário está autenticado e é admin

        // Verificar se o usuário é um parceiro (revendedor ou distribuidor)
        if (!in_array($user->role, ['revendedor', 'distribuidor'])) {
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
            
            // Retornar o arquivo como download
            return Storage::disk('local')->download($filePath, $fileName);
            
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
