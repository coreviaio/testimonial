<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PractitionerVerification extends Model
{
    use HasFactory;

    protected $table = 'practitioner_verifications';

    protected $fillable = [
        'practitioner_id',
        'attempt_number',
        'status',
        'application_snapshot',
        'applicant_note',
        'submitted_at',
        'reviewed_by_user_id',
        'reviewed_at',
        'review_comment',
        'internal_note',
    ];

    protected function casts(): array
    {
        return [
            'application_snapshot' => 'array',
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function practitioner(): BelongsTo
    {
        return $this->belongsTo(Practitioner::class);
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(PractitionerDocument::class, 'verification_id');
    }

    public function consents(): HasMany
    {
        return $this->hasMany(UserConsent::class, 'verification_id');
    }
}
