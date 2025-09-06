<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockFile extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'display_name',
        'file_path',
        'original_filename',
        'mime_type',
        'size',
        'is_active',
        'uploaded_by_user_id',
        'target_role',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_active' => 'boolean',
        'size' => 'integer',
    ];

    /**
     * Get the user who uploaded this file.
     */
    public function uploadedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }

    /**
     * Scope to get only active stock files.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get the most recent active stock file.
     */
    public static function getLatestActive()
    {
        return static::where('is_active', true)->latest()->first();
    }
}
