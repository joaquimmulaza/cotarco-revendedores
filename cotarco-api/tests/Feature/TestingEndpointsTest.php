<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Support\Facades\App;

class TestingEndpointsTest extends TestCase
{
    /**
     * Test that testing seed endpoints return 404 in non-testing environments.
     */
    public function test_endpoints_return_404_when_env_not_testing()
    {
        // Force the app environment to 'production'
        App::detectEnvironment(function () {
            return 'production';
        });

        // Test POST /api/testing/seed-partner
        $responsePost = $this->postJson('/api/testing/seed-partner', [
            'name' => 'Should Fail',
            'email' => 'fail@example.com',
            'initial_status' => 'active',
        ]);
        $responsePost->assertStatus(404);

        // Test DELETE /api/testing/seed-partner/1
        $responseDelete = $this->deleteJson('/api/testing/seed-partner/1');
        $responseDelete->assertStatus(404);
    }
}
