<?php

namespace Tests\Feature\Files;

use App\Models\User;
use App\Models\StockFile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StockFileManagementTest extends TestCase
{
    use RefreshDatabase;

    private $admin;
    private $approvedReseller;
    private $pendingReseller;

    protected function setUp(): void
    {
        parent::setUp();
        // Criar os utilizadores necessários para os testes
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->approvedReseller = User::factory()->create(['role' => 'revendedor', 'status' => 'active']);
        $this->pendingReseller = User::factory()->create(['role' => 'revendedor', 'status' => 'pending_approval']);
    }

    /**
     * Teste de upload de ficheiro de stock por um administrador
     */
    public function test_an_admin_can_upload_a_stock_file()
    {
        Storage::fake('local');

        $file = UploadedFile::fake()->create('stock_map.xlsx', 100, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        $response = $this->actingAs($this->admin)->postJson('/api/admin/stock-file/upload', [
            'display_name' => 'Mapa de Stock Agosto 2025',
            'file' => $file,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('stock_files', ['display_name' => 'Mapa de Stock Agosto 2025']);
        Storage::disk('local')->assertExists(StockFile::first()->file_path);
    }

    /**
     * Teste de download de ficheiro de stock por um revendedor aprovado
     */
    public function test_an_approved_reseller_can_download_an_active_stock_file()
    {
        Storage::fake('local');
        $file = UploadedFile::fake()->create('stock.xlsx', 100);
        $filePath = Storage::disk('local')->put('stock_files', $file);

        StockFile::create([
            'display_name' => 'Mapa de Stock Teste',
            'file_path' => $filePath,
            'original_filename' => 'stock.xlsx',
            'mime_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'size' => 100,
            'is_active' => true, // Ficheiro está ativo
            'uploaded_by_user_id' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->approvedReseller)->getJson('/api/revendedor/stock-file/download');

        $response->assertStatus(200);
        $response->assertHeader('content-disposition', 'attachment; filename=stock.xlsx');
    }

    /**
     * Teste de acesso negado para revendedores pendentes
     */
    public function test_a_pending_reseller_cannot_download_a_stock_file()
    {
        StockFile::create([
            'display_name' => 'Mapa de Stock Teste',
            'file_path' => 'stock_files/test.xlsx',
            'original_filename' => 'test.xlsx',
            'mime_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'size' => 100,
            'is_active' => true,
            'uploaded_by_user_id' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->pendingReseller)->getJson('/api/revendedor/stock-file/download');

        // Um revendedor pendente nem sequer deve ter acesso a esta rota
        $response->assertStatus(403); // Forbidden
    }

    /**
     * Teste de download de ficheiro inativo
     */
    public function test_an_approved_reseller_cannot_download_an_inactive_stock_file()
    {
        StockFile::create([
            'display_name' => 'Mapa de Stock Inativo',
            'file_path' => 'stock_files/inactive.xlsx',
            'original_filename' => 'inactive.xlsx',
            'mime_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'size' => 100,
            'is_active' => false, // Ficheiro está inativo
            'uploaded_by_user_id' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->approvedReseller)->getJson('/api/revendedor/stock-file/download');

        // A API deve retornar "Não encontrado" porque não há ficheiros ativos
        $response->assertStatus(404);
    }
}
