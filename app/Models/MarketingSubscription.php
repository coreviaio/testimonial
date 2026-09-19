<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MarketingSubscription extends Model
{
    use HasFactory;

    protected $table = 'marketing_subscriptions';

    protected $fillable = [
        'user_id',
        'email',
        'list_code',
        'status',
        'consent_version',
        'consent_text',
        'source',
        'subscribed_at',
        'unsubscribed_at',
        'provider_name',
        'external_contact_id',
        'sync_status',
        'last_synced_at',
        'last_sync_error',
    ];

    protected function casts(): array
    {
        return [
            'subscribed_at' => 'datetime',
            'unsubscribed_at' => 'datetime',
            'last_synced_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
