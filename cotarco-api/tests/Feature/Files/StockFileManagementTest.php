<?php

namespace Tests\Feature\Files;

use App\Models\User;
use App\Models\StockFile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class StockFileManagementTest extends TestCase
{
    use RefreshDatabase;

    private $admin;
    private $approvedDistributor;
    private $pendingDistributor;

    protected function setUp(): void
    {
        parent::setUp();
        // Criar os utilizadores necessários para os testes
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->approvedDistributor = User::factory()->create(['role' => 'distribuidor', 'status' => 'active']);
        $this->pendingDistributor = User::factory()->create(['role' => 'distribuidor', 'status' => 'pending_approval']);
        
        // Disable observer and cleanup
        StockFile::unsetEventDispatcher();
        // Limpar qualquer ficheiro de stock existente
        StockFile::query()->delete();
        \Illuminate\Support\Facades\Queue::fake();
    }

    /**
     * Teste de upload de ficheiro de stock por um administrador
     */
    #[Test]
    public function test_an_admin_can_upload_a_stock_file(): void
    {
        Storage::fake('local');

        // Create file with valid extension for validation
        $file = UploadedFile::fake()->create('stock_map.xlsx', 100, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        $response = $this->actingAs($this->admin)->postJson('/api/admin/stock-files/upload', [
            'display_name' => 'Mapa de Stock Agosto 2025',
            'file' => $file,
            'target_business_model' => 'B2B',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('stock_files', ['display_name' => 'Mapa de Stock Agosto 2025']);
        
        // Check if file exists in storage
        $stockFile = StockFile::where('display_name', 'Mapa de Stock Agosto 2025')->first();
        $this->assertNotNull($stockFile);
        Storage::disk('local')->assertExists($stockFile->file_path);
    }

    /**
     * Teste de download de ficheiro de stock por um distribuidor aprovado
     */
    #[Test]
    public function test_an_approved_distributor_can_download_an_active_stock_file(): void
    {
        Storage::fake('local');
        
        // Create profile for distributor
        \App\Models\PartnerProfile::create([
            'user_id' => $this->approvedDistributor->id,
            'company_name' => 'Test Company',
            'phone_number' => '923456789',
            'business_model' => 'B2B',
            'alvara_path' => 'alvaras/test.pdf',
        ]);
        
        // Criar um ficheiro real no storage
        $fileContent = 'fake excel content';
        $filePath = 'stock_files/test_stock.xlsx';
        Storage::disk('local')->put($filePath, $fileContent);

        $stockFile = StockFile::create([
            'display_name' => 'Mapa de Stock Teste',
            'file_path' => $filePath,
            'original_filename' => 'stock.xlsx',
            'mime_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'size' => strlen($fileContent),
            'is_active' => true, // Ficheiro está ativo
            'target_business_model' => 'B2B',
            'uploaded_by_user_id' => $this->admin->id,
        ]);

        // Debug: verificar se o ficheiro foi criado
        $this->assertDatabaseHas('stock_files', [
            'id' => $stockFile->id,
            'is_active' => true
        ]);

        // Debug: verificar se o método retorna o ficheiro (if method exists)
        // $latestActive = StockFile::getLatestActive();
        // $this->assertNotNull($latestActive, 'getLatestActive deve retornar um ficheiro ativo');

        $response = $this->actingAs($this->approvedDistributor)->getJson('/api/parceiro/stock-files/download');

        $response->assertStatus(200);
        $response->assertHeader('content-disposition', 'attachment; filename=stock.xlsx');
    }

    /**
     * Teste de acesso negado para distribuidores pendentes
     */
    #[Test]
    public function test_a_pending_distributor_cannot_download_a_stock_file(): void
    {
        // Ensure pending distributor has a profile
        \App\Models\PartnerProfile::create([
            'user_id' => $this->pendingDistributor->id,
            'company_name' => 'Test Company',
            'phone_number' => '923456789',
            'business_model' => 'B2B',
            'alvara_path' => 'alvaras/test.pdf',
        ]);

        StockFile::create([
            'display_name' => 'Mapa de Stock Teste',
            'file_path' => 'stock_files/test.xlsx',
            'original_filename' => 'test.xlsx',
            'mime_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'size' => 100,
            'is_active' => true,
            'target_business_model' => 'B2B',
            'uploaded_by_user_id' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->pendingDistributor)->getJson('/api/parceiro/stock-files/download');

        // Um distribuidor pendente nem sequer deve ter acesso a esta rota (Forbidden)
        $response->assertStatus(403); 
    }

    /**
     * Teste de download de ficheiro inativo
     */
    #[Test]
    public function test_an_approved_distributor_cannot_download_an_inactive_stock_file(): void
    {
        // Ensure distributor has a profile
        \App\Models\PartnerProfile::create([
            'user_id' => $this->approvedDistributor->id,
            'company_name' => 'Test Company',
            'phone_number' => '923456789',
            'business_model' => 'B2B',
            'alvara_path' => 'alvaras/test.pdf',
        ]);

        StockFile::create([
            'display_name' => 'Mapa de Stock Inativo',
            'file_path' => 'stock_files/inactive.xlsx',
            'original_filename' => 'inactive.xlsx',
            'mime_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'size' => 100,
            'is_active' => false, // Ficheiro está inativo
            'target_business_model' => 'B2B',
            'uploaded_by_user_id' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->approvedDistributor)->getJson('/api/parceiro/stock-files/download');

        // A API deve retornar "Não encontrado" porque não há ficheiros ativos
        $response->assertStatus(404);
    }

    /**
     * Teste de download de ficheiro com modelo de negócio errado
     */
    #[Test]
    public function test_distributor_cannot_download_wrong_business_model_file(): void
    {
        Storage::fake('local');
        
        \App\Models\PartnerProfile::create([
            'user_id' => $this->approvedDistributor->id,
            'company_name' => 'Test Company',
            'phone_number' => '923456789',
            'business_model' => 'B2B',
            'alvara_path' => 'alvaras/test.pdf',
        ]);

        $fileContent = 'fake excel content';
        $filePath = 'stock_files/test_stock.xlsx';
        Storage::disk('local')->put($filePath, $fileContent);

        StockFile::create([
            'display_name' => 'Mapa de Stock B2C',
            'file_path' => $filePath,
            'original_filename' => 'stock.xlsx',
            'mime_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'size' => 100,
            'is_active' => true,
            'target_business_model' => 'B2C', // Diferente do user (B2B)
            'uploaded_by_user_id' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->approvedDistributor)->getJson('/api/parceiro/stock-files/download');

        $response->assertStatus(404);
    }

    /**
     * Teste de alteração de status do ficheiro (Admin)
     */
    #[Test]
    public function test_admin_can_toggle_stock_file_status(): void
    {
        $stockFile = StockFile::create([
            'display_name' => 'Mapa de Stock',
            'file_path' => 'stock_files/test.xlsx',
            'original_filename' => 'test.xlsx',
            'mime_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'size' => 100,
            'is_active' => true,
            'target_business_model' => 'B2B',
            'uploaded_by_user_id' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin)->patchJson("/api/admin/stock-files/{$stockFile->id}/toggle-status");

        $response->assertStatus(200);
        
        $stockFile->refresh();
        $this->assertFalse($stockFile->is_active);
    }

    /**
     * Teste de eliminação de ficheiro (Admin)
     */
    #[Test]
    public function test_admin_can_delete_stock_file(): void
    {
        Storage::fake('local');
        
        $fileContent = 'fake content';
        $filePath = 'stock_files/to_delete.xlsx';
        Storage::disk('local')->put($filePath, $fileContent);

        $stockFile = StockFile::create([
            'display_name' => 'Mapa de Stock Delete',
            'file_path' => $filePath,
            'original_filename' => 'delete.xlsx',
            'mime_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'size' => 100,
            'is_active' => true,
            'target_business_model' => 'B2B',
            'uploaded_by_user_id' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin)->deleteJson("/api/admin/stock-files/{$stockFile->id}");

        $response->assertStatus(200);
        
        $this->assertDatabaseMissing('stock_files', ['id' => $stockFile->id]);
        Storage::disk('local')->assertMissing($filePath);
    }
}
