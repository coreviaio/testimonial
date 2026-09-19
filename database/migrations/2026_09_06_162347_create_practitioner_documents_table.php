<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('practitioner_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('verification_id')
                ->constrained('practitioner_verifications')
                ->restrictOnDelete();
            $table->foreignId('uploaded_by_user_id')->constrained('users')->restrictOnDelete();
            $table->string('document_type', 40);
            $table->string('storage_disk', 50);
            $table->string('file_path', 1024);
            $table->string('original_filename');
            $table->string('mime_type', 127);
            $table->unsignedBigInteger('size_bytes');
            $table->char('sha256', 64);
            $table->date('expires_at')->nullable();
            $table->timestamps(6);

            $table->index(['verification_id', 'document_type'], 'pd_verification_type_index');
            $table->index('expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('practitioner_documents');
    }
};
