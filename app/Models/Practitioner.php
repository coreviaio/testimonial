<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Practitioner extends Model
{
    use HasFactory;

    protected $table = 'practitioners';

    protected $fillable = [
        'user_id',
        'practitioner_type',
        'professional_title',
        'specialty',
        'professional_bio',
        'organization_name',
        'years_of_experience',
        'license_number',
        'issuing_authority',
        'registration_jurisdiction',
        'professional_website',
        'verification_notes',
        'show_identity_publicly',
        'public_display_name',
        'public_professional_description',
        'verification_status',
    ];

    protected function casts(): array
    {
        return [
            'years_of_experience' => 'decimal:1',
            'show_identity_publicly' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function verifications(): HasMany
    {
        return $this->hasMany(PractitionerVerification::class);
    }

    public function clients(): HasMany
    {
        return $this->hasMany(Client::class);
    }

    public function testimonials(): HasMany
    {
        return $this->hasMany(Testimonial::class);
    }
}
