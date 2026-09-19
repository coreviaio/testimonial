<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TestimonialConsent extends Model
{
    use HasFactory;

    public const UPDATED_AT = null;

    protected $table = 'testimonial_consents';

    protected $fillable = [
        'version_id',
        'accepted_by_user_id',
        'statement_code',
        'statement_version',
        'statement_text',
        'accepted_at',
    ];

    protected function casts(): array
    {
        return ['accepted_at' => 'datetime'];
    }

    public function version(): BelongsTo
    {
        return $this->belongsTo(TestimonialVersion::class, 'version_id');
    }

    public function acceptedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'accepted_by_user_id');
    }
}
