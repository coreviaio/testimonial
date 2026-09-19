<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TestimonialReview extends Model
{
    use HasFactory;

    public const UPDATED_AT = null;

    protected $table = 'testimonial_reviews';

    protected $fillable = [
        'testimonial_id',
        'version_id',
        'actor_user_id',
        'action',
        'from_status',
        'to_status',
        'review_comment',
        'internal_note',
        'condition_check',
        'observation_language_check',
        'deidentification_check',
        'consent_check',
        'publication_check',
        'acted_at',
    ];

    protected function casts(): array
    {
        return ['acted_at' => 'datetime'];
    }

    public function testimonial(): BelongsTo
    {
        return $this->belongsTo(Testimonial::class);
    }

    public function version(): BelongsTo
    {
        return $this->belongsTo(TestimonialVersion::class, 'version_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }
}
