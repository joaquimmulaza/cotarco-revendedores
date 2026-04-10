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
        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make('password123'),
            'role' => 'revendedor',
            'status' => $status,
            'email_verified_at' => now(),
        ]);

        PartnerProfile::create([
            'user_id' => $user->id,
            'company_name' => $name . ' Ltd',
            'phone_number' => '+351912345678',
            'alvara_path' => 'alvaras/dummy.pdf',
            'business_model' => 'B2B',
            'discount_percentage' => 10.00
        ]);
        
        return $user;
    }
}
