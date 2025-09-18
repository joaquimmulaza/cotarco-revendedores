<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessStockFileJob;
use App\Models\StockFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class StockFileController extends Controller
{
    /**
     * Constructor - aplicar middlewares
     */
    public function __construct()
    {
        // Middlewares de admin para métodos administrativos
        $this->middleware(['auth:sanctum', 'admin'])->only([
            'uploadOrUpdate', 
            'getCurrentForAdmin', 
            'toggleStatus', 
            'destroy'
        ]);
        
        // Nota: Os middlewares para parceiros são aplicados nas rotas da API
        // para permitir flexibilidade entre revendedores e distribuidores
    }

    /**
     * Upload de novo ficheiro de stock (Admin)
     */
    public function uploadOrUpdate(Request $request): JsonResponse
    {
        // Validar o ficheiro
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:xlsx,xls|max:10240', // 10MB
            'display_name' => 'required|string|max:255',
            'target_role' => 'required|string|in:revendedor,distribuidor',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Dados de entrada inválidos.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // 1. Procurar StockFile existente com base no target_role
            $existingStockFile = StockFile::where('target_role', $request->input('target_role'))->first();

            // 2. Se um StockFile antigo for encontrado, apagar o ficheiro físico
            if ($existingStockFile && Storage::exists($existingStockFile->file_path)) {
                Storage::delete($existingStockFile->file_path);
            }

            // 3. Guardar novo ficheiro no armazenamento
            $file = $request->file('file');
            $fileName = time() . '_' . hash('sha256', $file->getClientOriginalName()) . '.' . $file->getClientOriginalExtension();
            $filePath = $file->storeAs('stock_files', $fileName, 'local');

            // 4. Usar updateOrCreate para atualizar ou criar o registo
            // Se o display_name for diferente do nome original, usar o display_name como original_filename
            $originalFilename = $request->input('display_name') !== $file->getClientOriginalName() 
                ? $request->input('display_name') 
                : $file->getClientOriginalName();

            $stockFile = StockFile::updateOrCreate(
                ['target_role' => $request->input('target_role')], // Condição de procura
                [
                    'display_name' => $request->input('display_name'),
                    'file_path' => $filePath,
                    'original_filename' => $originalFilename,
                    'mime_type' => $file->getMimeType(),
                    'size' => $file->getSize(),
                    'is_active' => true,
                    'uploaded_by_user_id' => auth()->id(),
                ]
            );

            // Disparar o Job para processar o arquivo em segundo plano
            ProcessStockFileJob::dispatch($filePath, $request->input('target_role'));

            return response()->json([
                'message' => 'Ficheiro recebido. A importação dos preços foi iniciada em segundo plano.',
                'file' => [
                    'id' => $stockFile->id,
                    'display_name' => $stockFile->display_name,
                    'original_filename' => $stockFile->original_filename,
                    'size' => $stockFile->size,
                    'is_active' => $stockFile->is_active,
                    'target_role' => $stockFile->target_role,
                    'uploaded_at' => $stockFile->created_at,
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao carregar o ficheiro.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obter ficheiro atual para o painel de admin
     */
    public function getCurrentForAdmin(): JsonResponse
    {
        $stockFile = StockFile::with('uploadedByUser:id,name,email')->latest()->first();

        if (!$stockFile) {
            return response()->json([
                'message' => 'Nenhum ficheiro de stock encontrado.',
                'file' => null,
            ], 200);
        }

        return response()->json([
            'file' => [
                'id' => $stockFile->id,
                'display_name' => $stockFile->display_name,
                'original_filename' => $stockFile->original_filename,
                'mime_type' => $stockFile->mime_type,
                'size' => $stockFile->size,
                'is_active' => $stockFile->is_active,
                'target_role' => $stockFile->target_role,
                'uploaded_by' => $stockFile->uploadedByUser,
                'created_at' => $stockFile->created_at,
                'updated_at' => $stockFile->updated_at,
            ],
        ], 200);
    }

    /**
     * Obter ficheiros de stock com lógica de autorização
     */
    public function getStockFiles(): JsonResponse
    {
        $user = auth()->user();
        
        if ($user->role === 'admin') {
            // Admin vê todos os ficheiros
            $stockFiles = StockFile::with('uploadedByUser:id,name,email')
                ->orderBy('created_at', 'desc')
                ->get();
        } else {
            // Outros utilizadores veem apenas ficheiros do seu target_role
            $stockFiles = StockFile::with('uploadedByUser:id,name,email')
                ->where('target_role', $user->role)
                ->orderBy('created_at', 'desc')
                ->get();
        }

        return response()->json([
            'files' => $stockFiles->map(function ($file) {
                return [
                    'id' => $file->id,
                    'display_name' => $file->display_name,
                    'original_filename' => $file->original_filename,
                    'mime_type' => $file->mime_type,
                    'size' => $file->size,
                    'is_active' => $file->is_active,
                    'target_role' => $file->target_role,
                    'uploaded_by' => $file->uploadedByUser,
                    'created_at' => $file->created_at,
                    'updated_at' => $file->updated_at,
                ];
            }),
        ], 200);
    }

    /**
     * Ativar/desativar ficheiro de stock
     */
    public function toggleStatus(StockFile $file): JsonResponse
    {
        try {
            $file->is_active = !$file->is_active;
            $file->save();

            $status = $file->is_active ? 'ativado' : 'desativado';

            return response()->json([
                'message' => "Ficheiro de stock {$status} com sucesso.",
                'file' => [
                    'id' => $file->id,
                    'display_name' => $file->display_name,
                    'is_active' => $file->is_active,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao alterar o status do ficheiro.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Apagar ficheiro de stock
     */
    public function destroy(StockFile $file): JsonResponse
    {
        try {
            // Apagar ficheiro físico
            if (Storage::exists($file->file_path)) {
                Storage::delete($file->file_path);
            }

            // Apagar registo da BD
            $file->delete();

            return response()->json([
                'message' => 'Ficheiro de stock apagado com sucesso.',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao apagar o ficheiro.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obter informações dos ficheiros para parceiro
     */
    public function getForPartner(): JsonResponse
    {
        $user = auth()->user();
        
        $stockFiles = StockFile::where('is_active', true)
            ->where('target_role', $user->role)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'files' => $stockFiles->map(function ($file) {
                return [
                    'id' => $file->id,
                    'display_name' => $file->display_name,
                    'original_filename' => $file->original_filename,
                    'size' => $file->size,
                    'target_role' => $file->target_role,
                    'is_active' => $file->is_active,
                    'created_at' => $file->created_at,
                    'updated_at' => $file->updated_at,
                ];
            }),
        ], 200);
    }

    /**
     * Download do ficheiro para parceiro
     */
    public function downloadForPartner(): BinaryFileResponse|JsonResponse
    {
        $user = auth()->user();
        
        $stockFile = StockFile::where('is_active', true)
            ->where('target_role', $user->role)
            ->latest()
            ->first();

        if (!$stockFile) {
            return response()->json([
                'message' => 'Nenhum mapa de stock disponível para download.',
            ], 404);
        }

        // Verificar se o ficheiro existe fisicamente
        if (!Storage::exists($stockFile->file_path)) {
            return response()->json([
                'message' => 'Ficheiro não encontrado no servidor.',
            ], 404);
        }

        try {
            // Fazer download do ficheiro
            $filePath = Storage::path($stockFile->file_path);
            
            return response()->download(
                $filePath,
                $stockFile->original_filename,
                [
                    'Content-Type' => $stockFile->mime_type,
                    'Content-Disposition' => 'attachment; filename="' . $stockFile->original_filename . '"',
                ]
            );

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao fazer download do ficheiro.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Download de ficheiro específico para revendedor
     */
    public function downloadSpecificFile(StockFile $file): BinaryFileResponse|JsonResponse
    {
        $user = auth()->user();
        
        // Verificar se o ficheiro pertence ao utilizador (baseado no target_role)
        if ($file->target_role !== $user->role) {
            return response()->json([
                'message' => 'Ficheiro não disponível para o seu tipo de utilizador.',
            ], 403);
        }

        // Verificar se o ficheiro está ativo
        if (!$file->is_active) {
            return response()->json([
                'message' => 'Ficheiro não está disponível para download.',
            ], 404);
        }

        // Verificar se o ficheiro existe fisicamente
        if (!Storage::exists($file->file_path)) {
            return response()->json([
                'message' => 'Ficheiro não encontrado no servidor.',
            ], 404);
        }

        try {
            // Fazer download do ficheiro
            $filePath = Storage::path($file->file_path);
            
            return response()->download(
                $filePath,
                $file->original_filename,
                [
                    'Content-Type' => $file->mime_type,
                    'Content-Disposition' => 'attachment; filename="' . $file->original_filename . '"',
                ]
            );

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao fazer download do ficheiro.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
