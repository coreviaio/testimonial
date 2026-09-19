<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Testimonial extends Model
{
    use HasFactory;

    protected $table = 'testimonials';

    protected $fillable = [
        'author_user_id',
        'submission_type',
        'practitioner_id',
        'client_id',
        'title',
        'slug',
        'observation',
        'condition_symptom_text',
        'duration_text',
        'frequency_text',
        'timeline_text',
        'practitioner_note',
        'status',
        'latest_version_id',
        'submitted_at',
        'published_at',
        'published_by_user_id',
        'flagged_for_admin',
        'flagged_by_user_id',
        'flagged_at',
        'show_on_disease_pages',
        'show_on_organ_pages',
        'show_on_system_pages',
        'show_on_article_pages',
        'public_display_note',
        'internal_tags',
        'archived_by_user_id',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
            'published_at' => 'datetime',
            'flagged_for_admin' => 'boolean',
            'flagged_at' => 'datetime',
            'show_on_disease_pages' => 'boolean',
            'show_on_organ_pages' => 'boolean',
            'show_on_system_pages' => 'boolean',
            'show_on_article_pages' => 'boolean',
            'internal_tags' => 'array',
            'archived_at' => 'datetime',
        ];
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_user_id');
    }

    public function practitioner(): BelongsTo
    {
        return $this->belongsTo(Practitioner::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function latestVersion(): BelongsTo
    {
        return $this->belongsTo(TestimonialVersion::class, 'latest_version_id');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(TestimonialVersion::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(TestimonialReview::class);
    }
}
