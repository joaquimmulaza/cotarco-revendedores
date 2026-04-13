<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\PartnerProfile;
use Illuminate\Support\Facades\Hash;

class AdminE2ETestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Limpar dados de teste anteriores
        $testEmails = [
            'approve@example.com', 
            'reject@example.com', 
            'deactivate@example.com', 
            'edit@example.com'
        ];
        
        User::whereIn('email', $testEmails)->delete();

        // 1. For Approve Action
        $this->createPartner('Approve Test Partner', 'approve@example.com', 'pending_approval');
        
        // 2. For Reject Action
        $this->createPartner('Reject Test Partner', 'reject@example.com', 'pending_approval');
        
        // 3. For Deactivate Action
        $this->createPartner('Deactivate Test Partner', 'deactivate@example.com', 'active');
        
        // 4. For Edit Action
        $this->createPartner('Edit Test Partner', 'edit@example.com', 'active');
    }

    private function createPartner($name, $email, $status)
    {
        // updateOrCreate prevents duplicate-key errors when the seeder is run
        // without a preceding migrate:fresh (e.g. during local debugging).
        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name'               => $name,
                'password'           => Hash::make('password123'),
                // 'distribuidor' matches what RegisterPartnerAction and
                // SeedPartnerController assign, keeping test data consistent.
                'role'               => 'distribuidor',
                'status'             => $status,
                'email_verified_at'  => now(),
            ]
        );

        PartnerProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'company_name'        => $name . ' Ltd',
                'phone_number'        => '+351912345678',
                'alvara_path'         => 'alvaras/dummy.pdf',
                'business_model'      => 'B2B',
                'discount_percentage' => 10.00,
            ]
        );

        return $user;
    }
}
