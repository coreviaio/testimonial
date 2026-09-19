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
        Schema::create('testimonial_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('testimonial_id')->constrained('testimonials')->restrictOnDelete();
            $table->unsignedBigInteger('version_id')->nullable();
            $table->foreignId('actor_user_id')->constrained('users')->restrictOnDelete();
            $table->string('action', 40);
            $table->string('from_status', 32)->nullable();
            $table->string('to_status', 32);
            $table->text('review_comment')->nullable();
            $table->text('internal_note')->nullable();
            $table->string('condition_check', 20)->nullable();
            $table->string('observation_language_check', 20)->nullable();
            $table->string('deidentification_check', 20)->nullable();
            $table->string('consent_check', 20)->nullable();
            $table->string('publication_check', 20)->nullable();
            $table->dateTime('acted_at', 6);
            $table->timestamp('created_at', 6)->useCurrent();

            $table->foreign(
                ['testimonial_id', 'version_id'],
                'tr_testimonial_version_fk',
            )->references(['testimonial_id', 'id'])
                ->on('testimonial_versions')
                ->restrictOnDelete();

            $table->index(['testimonial_id', 'acted_at', 'id'], 'tr_testimonial_acted_id_index');
            $table->index('version_id');
            $table->index(['actor_user_id', 'acted_at'], 'tr_actor_acted_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('testimonial_reviews');
    }
};
