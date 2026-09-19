<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TestimonialVersion extends Model
{
    use HasFactory;

    protected $table = 'testimonial_versions';

    protected $fillable = [
        'testimonial_id',
        'version_number',
        'submitted_snapshot',
        'approved_snapshot',
        'submitted_by_user_id',
        'submitted_at',
        'client_consent_id',
        'approved_by_user_id',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'submitted_snapshot' => 'array',
            'approved_snapshot' => 'array',
            'submitted_at' => 'datetime',
            'approved_at' => 'datetime',
        ];
    }

    public function testimonial(): BelongsTo
    {
        return $this->belongsTo(Testimonial::class);
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by_user_id');
    }

    public function clientConsent(): BelongsTo
    {
        return $this->belongsTo(ClientConsent::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    public function consents(): HasMany
    {
        return $this->hasMany(TestimonialConsent::class, 'version_id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(TestimonialReview::class, 'version_id');
    }
}
