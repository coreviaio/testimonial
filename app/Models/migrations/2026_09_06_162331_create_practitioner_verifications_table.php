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
        Schema::create('practitioner_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('practitioner_id')->constrained('practitioners')->restrictOnDelete();
            $table->unsignedInteger('attempt_number');
            $table->string('status', 32)->default('draft');
            $table->json('application_snapshot')->nullable();
            $table->text('applicant_note')->nullable();
            $table->dateTime('submitted_at', 6)->nullable();
            $table->foreignId('reviewed_by_user_id')
                ->nullable()
                ->constrained('users')
                ->restrictOnDelete();
            $table->dateTime('reviewed_at', 6)->nullable();
            $table->text('review_comment')->nullable();
            $table->text('internal_note')->nullable();
            $table->timestamps(6);

            $table->unique(['practitioner_id', 'attempt_number'], 'pv_practitioner_attempt_unique');
            $table->index(['status', 'submitted_at'], 'pv_status_submitted_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('practitioner_verifications');
    }
};
