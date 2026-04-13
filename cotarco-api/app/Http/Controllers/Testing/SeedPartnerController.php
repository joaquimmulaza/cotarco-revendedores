<?php

namespace App\Http\Controllers\Testing;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\PartnerProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class SeedPartnerController extends Controller
{
    public function store(Request $request)
    {
        if (app()->environment() !== 'testing') {
            abort(404);
        }

        $validated = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'initial_status' => 'required|in:pending_email_validation,pending_approval,active',
        ]);

        DB::beginTransaction();
        try {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make('Password123!'),
                'role' => 'distribuidor',
                'status' => $validated['initial_status'],
            ]);

            if ($validated['initial_status'] !== 'pending_email_validation') {
                $user->email_verified_at = now();
                $user->save();
            }

            PartnerProfile::create([
                'user_id' => $user->id,
                'company_name' => 'Empresa ' . $validated['name'],
                'phone_number' => '910000000',
                'alvara_path' => 'testing/dummy.pdf',
            ]);

            DB::commit();

            return response()->json([
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'status' => $user->status,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function destroy($id)
    {
        if (app()->environment() !== 'testing') {
            abort(404);
        }

        $user = User::find($id);
        
        if (!$user) {
            return response()->json(['message' => 'Not found'], 404);
        }

        // Hard delete profiles to avoid constraint violation
        DB::table('partner_profiles')->where('user_id', $id)->delete();
        
        // Hard delete user
        DB::table('users')->where('id', $id)->delete();

        return response()->noContent();
    }
}
