<?php

namespace App\Http\Controllers;

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
        
        // Middleware de revendedor para métodos de revendedor
        $this->middleware(['auth:sanctum', 'revendedor'])->only([
            'getForRevendedor', 
            'downloadForRevendedor'
        ]);
    }

    /**
     * Upload ou atualizar o ficheiro de stock (Admin)
     */
    public function uploadOrUpdate(Request $request): JsonResponse
    {
        // Validar o ficheiro
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:xlsx,xls|max:10240', // 10MB
            'display_name' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Dados de entrada inválidos.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // Apagar ficheiro e registo antigo, se existir
            $existingFile = StockFile::latest()->first();
            if ($existingFile) {
                // Apagar ficheiro físico
                if (Storage::exists($existingFile->file_path)) {
                    Storage::delete($existingFile->file_path);
                }
                // Apagar registo da BD
                $existingFile->delete();
            }

            // Guardar novo ficheiro
            $file = $request->file('file');
            $fileName = time() . '_' . hash('sha256', $file->getClientOriginalName()) . '.' . $file->getClientOriginalExtension();
            $filePath = $file->storeAs('stock_files', $fileName, 'local');

            // Criar novo registo na BD
            $stockFile = StockFile::create([
                'display_name' => $request->input('display_name'),
                'file_path' => $filePath,
                'original_filename' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
                'is_active' => true,
                'uploaded_by_user_id' => auth()->id(),
            ]);

            return response()->json([
                'message' => 'Ficheiro de stock carregado com sucesso.',
                'file' => [
                    'id' => $stockFile->id,
                    'display_name' => $stockFile->display_name,
                    'original_filename' => $stockFile->original_filename,
                    'size' => $stockFile->size,
                    'is_active' => $stockFile->is_active,
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
                'uploaded_by' => $stockFile->uploadedByUser,
                'created_at' => $stockFile->created_at,
                'updated_at' => $stockFile->updated_at,
            ],
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
     * Obter informações do ficheiro para revendedor
     */
    public function getForRevendedor(): JsonResponse
    {
        $stockFile = StockFile::getLatestActive();

        if (!$stockFile) {
            return response()->json([
                'message' => 'Nenhum mapa de stock disponível no momento.',
                'file' => null,
            ], 404);
        }

        return response()->json([
            'file' => [
                'display_name' => $stockFile->display_name,
                'size' => $stockFile->size,
                'updated_at' => $stockFile->updated_at,
            ],
        ], 200);
    }

    /**
     * Download do ficheiro para revendedor
     */
    public function downloadForRevendedor(): BinaryFileResponse|JsonResponse
    {
        $stockFile = StockFile::getLatestActive();

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
}
