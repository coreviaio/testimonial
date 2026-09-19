<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PractitionerDocument extends Model
{
    use HasFactory;

    protected $table = 'practitioner_documents';

    protected $fillable = [
        'verification_id',
        'uploaded_by_user_id',
        'document_type',
        'storage_disk',
        'file_path',
        'original_filename',
        'mime_type',
        'size_bytes',
        'sha256',
        'expires_at',
    ];

    protected function casts(): array
    {
        return ['expires_at' => 'date'];
    }

    public function verification(): BelongsTo
    {
        return $this->belongsTo(PractitionerVerification::class, 'verification_id');
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }
}
