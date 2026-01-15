<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PartnerProfile extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'company_name',
        'phone_number',
        'alvara_path',
        'business_model',
        'discount_percentage',
    ];

    /**
     * Get the user that owns the partner profile.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
