<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;
use PHPUnit\Framework\Attributes\Test;

class AdminDashboardStatsTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->admin = User::factory()->create([
            'role' => 'admin',
            'status' => 'active'
        ]);
    }

    /**
     * Teste para verificar se o administrador pode aceder às estatísticas
     */
    #[Test]
    public function test_admin_can_access_dashboard_stats(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/admin/dashboard-stats');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'message',
                     'data' => [
                         'parceiros' => [
                             'pending_approval',
                             'active',
                             'rejected',
                             'inactive',
                             'total'
                         ],
                         'por_tipo' => [
                             'b2b',
                             'b2c'
                         ],
                         'sales',
                         'orders'
                     ]
                 ]);
    }

    /**
     * Teste para verificar se as contagens estão corretas por status e tipo
     */
    #[Test]
    public function test_dashboard_stats_counts_are_correct(): void
    {
        Sanctum::actingAs($this->admin);

        // Criar parceiros com diferentes estados e tipos
        // Ativos
        User::factory()->count(3)->has(\App\Models\PartnerProfile::factory()->state(['business_model' => 'B2C']))->create(['role' => 'distribuidor', 'status' => 'active']);
        User::factory()->count(2)->has(\App\Models\PartnerProfile::factory()->state(['business_model' => 'B2B']))->create(['role' => 'distribuidor', 'status' => 'active']);
        
        // Pendentes
        User::factory()->count(4)->has(\App\Models\PartnerProfile::factory()->state(['business_model' => 'B2C']))->create(['role' => 'distribuidor', 'status' => 'pending_approval']);
        User::factory()->count(1)->has(\App\Models\PartnerProfile::factory()->state(['business_model' => 'B2B']))->create(['role' => 'distribuidor', 'status' => 'pending_approval']);
        
        // Rejeitados
        User::factory()->count(2)->has(\App\Models\PartnerProfile::factory()->state(['business_model' => 'B2C']))->create(['role' => 'distribuidor', 'status' => 'rejected']);
        
        // Inativos
        User::factory()->count(1)->has(\App\Models\PartnerProfile::factory()->state(['business_model' => 'B2B']))->create(['role' => 'distribuidor', 'status' => 'inactive']);

        $response = $this->getJson('/api/admin/dashboard-stats');

        $response->assertStatus(200);
        $data = $response->json('data');

        // Verificar contagens por status
        $this->assertEquals(5, $data['parceiros']['active']);
        $this->assertEquals(5, $data['parceiros']['pending_approval']);
        $this->assertEquals(2, $data['parceiros']['rejected']);
        $this->assertEquals(1, $data['parceiros']['inactive']);
        $this->assertEquals(13, $data['parceiros']['total']);

        // Verificar contagens por tipo
        $this->assertEquals(9, $data['por_tipo']['b2c']); // 3 active + 4 pending + 2 rejected
        $this->assertEquals(4, $data['por_tipo']['b2b']); // 2 active + 1 pending + 1 inactive
    }

    /**
     * Teste para verificar que utilizadores com pending_email_validation são excluídos das contagens por tipo
     */
    #[Test]
    public function test_dashboard_stats_excludes_pending_email_validation(): void
    {
        Sanctum::actingAs($this->admin);

        // Criar utilizadores com pending_email_validation
        User::factory()->has(\App\Models\PartnerProfile::factory()->state(['business_model' => 'B2B']))->create(['role' => 'distribuidor', 'status' => 'pending_email_validation']);
        User::factory()->has(\App\Models\PartnerProfile::factory()->state(['business_model' => 'B2B']))->create(['role' => 'distribuidor', 'status' => 'pending_email_validation']);
        
        // Criar um ativo para comparação
        User::factory()->has(\App\Models\PartnerProfile::factory()->state(['business_model' => 'B2C']))->create(['role' => 'distribuidor', 'status' => 'active']);

        $response = $this->getJson('/api/admin/dashboard-stats');

        $response->assertStatus(200);
        $data = $response->json('data');

        // As contagens por tipo não devem incluir os pending_email_validation
        $this->assertEquals(1, $data['por_tipo']['b2c']);
        $this->assertEquals(0, $data['por_tipo']['b2b']);
        
        // No total de parceiros por status também não devem aparecer
        $this->assertEquals(1, $data['parceiros']['total']);
    }

    /**
     * Teste para verificar que utilizadores sem privilégios de admin não podem aceder
     */
    #[Test]
    public function test_non_admin_users_cannot_access_dashboard_stats(): void
    {
        $user = User::factory()->create(['role' => 'distribuidor', 'status' => 'active']);
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/admin/dashboard-stats');
        $response->assertStatus(403);
    }
}
