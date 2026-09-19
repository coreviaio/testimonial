<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserConsent extends Model
{
    use HasFactory;

    public const UPDATED_AT = null;

    protected $table = 'user_consents';

    protected $fillable = [
        'user_id',
        'context',
        'verification_id',
        'acknowledgement_set_id',
        'statement_code',
        'statement_version',
        'statement_text',
        'accepted_at',
    ];

    protected function casts(): array
    {
        return ['accepted_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function verification(): BelongsTo
    {
        return $this->belongsTo(PractitionerVerification::class, 'verification_id');
    }
}
