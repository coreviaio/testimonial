<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientConsent extends Model
{
    use HasFactory;

    public const UPDATED_AT = null;

    protected $table = 'client_consents';

    protected $fillable = [
        'client_id',
        'recorded_by_user_id',
        'action',
        'statement_version',
        'statement_text',
        'occurred_at',
        'note',
    ];

    protected function casts(): array
    {
        return ['occurred_at' => 'datetime'];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by_user_id');
    }
}
