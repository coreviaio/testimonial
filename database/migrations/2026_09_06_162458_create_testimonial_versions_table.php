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
        Schema::create('testimonial_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('testimonial_id')->constrained('testimonials')->restrictOnDelete();
            $table->unsignedInteger('version_number');
            $table->json('submitted_snapshot');
            $table->json('approved_snapshot')->nullable();
            $table->foreignId('submitted_by_user_id')->constrained('users')->restrictOnDelete();
            $table->dateTime('submitted_at', 6);
            $table->foreignId('client_consent_id')
                ->nullable()
                ->constrained('client_consents')
                ->restrictOnDelete();
            $table->foreignId('approved_by_user_id')
                ->nullable()
                ->constrained('users')
                ->restrictOnDelete();
            $table->dateTime('approved_at', 6)->nullable();
            $table->timestamps(6);

            $table->unique(['testimonial_id', 'version_number'], 'tv_testimonial_version_unique');
            $table->unique(['testimonial_id', 'id'], 'tv_testimonial_id_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('testimonial_versions');
    }
};
