<?php

namespace Tests\Feature;

use App\Mail\AdminNewPartnerNotification;
use App\Models\User;
use App\Models\PartnerProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test user registration.
     */
    public function test_user_registration(): void
    {
        \Illuminate\Support\Facades\Notification::fake();
        Storage::fake('local');

        $file = UploadedFile::fake()->create('alvara.pdf', 100);

        $userData = [
            'name' => 'Test Partner',
            'email' => 'partner@test.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'company_name' => 'Test Company',
            'phone_number' => '923456789',
            'business_model' => 'B2B',
            'alvara' => $file,
        ];

        $response = $this->postJson('/api/register', $userData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'user' => ['id', 'name', 'email', 'status'],
            ]);

        // Assert user was created
        $this->assertDatabaseHas('users', [
            'email' => 'partner@test.com',
            'status' => 'pending_email_validation',
        ]);

        // Assert partner profile was created
        $this->assertDatabaseHas('partner_profiles', [
            'company_name' => 'Test Company',
        ]);

        // Assert verification email was sent
        $user = User::where('email', 'partner@test.com')->first();
        \Illuminate\Support\Facades\Notification::assertSentTo(
            $user,
            \App\Notifications\CustomEmailVerificationNotification::class
        );
    }

    /**
     * Test email verification flow.
     */
    public function test_email_verification(): void
    {
        Mail::fake();

        $user = User::factory()->create([
            'email_verified_at' => null,
            'role' => 'distribuidor',
            'status' => 'pending_email_validation',
        ]);

        PartnerProfile::create([
            'user_id' => $user->id,
            'company_name' => 'Test Company',
            'phone_number' => '923456789',
            'business_model' => 'B2B',
            'alvara_path' => 'alvaras/test.pdf',
        ]);

        // Create admin user
        User::factory()->create([
            'role' => 'admin',
            'email' => 'admin@cotarco.com',
            'status' => 'active',
        ]);

        // Generate verification URL
        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            [
                'id' => $user->id,
                'hash' => sha1($user->email),
            ]
        );

        $response = $this->get($verificationUrl);

        // Should redirect to frontend
        $response->assertRedirect();
        $this->assertStringContainsString('/email-validated', $response->headers->get('Location'));

        // Assert user email was verified
        $user->refresh();
        $this->assertNotNull($user->email_verified_at);
        $this->assertEquals('pending_approval', $user->status);

        // Assert admin notification was sent
        Mail::assertSent(AdminNewPartnerNotification::class);
    }

    /**
     * Test registration with invalid data.
     */
    public function test_registration_validation(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => '',
            'email' => 'invalid-email',
            'password' => '123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    /**
     * Test login with valid credentials.
     */
    public function test_user_login(): void
    {
        $user = User::factory()->create([
            'email' => 'login-test@example.com',
            'password' => bcrypt('password123'),
            'role' => 'distribuidor',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'login-test@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'user',
                'token',
            ]);
    }

    /**
     * Test login with invalid credentials.
     */
    public function test_login_with_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'invalid-test@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'invalid-test@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401);
    }
}
