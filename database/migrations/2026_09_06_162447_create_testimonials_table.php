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
        Schema::create('testimonials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('author_user_id')->constrained('users')->restrictOnDelete();
            $table->string('submission_type', 20);
            $table->foreignId('practitioner_id')->nullable()->constrained('practitioners')->restrictOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('clients')->restrictOnDelete();
            $table->string('title')->nullable();
            $table->string('slug')->nullable()->unique();
            $table->longText('observation')->nullable();
            $table->string('condition_symptom_text', 500)->nullable();
            $table->string('duration_text')->nullable();
            $table->string('frequency_text')->nullable();
            $table->text('timeline_text')->nullable();
            $table->text('practitioner_note')->nullable();
            $table->string('status', 32)->default('draft');
            $table->unsignedBigInteger('latest_version_id')->nullable();
            $table->dateTime('submitted_at', 6)->nullable();
            $table->dateTime('published_at', 6)->nullable();
            $table->foreignId('published_by_user_id')
                ->nullable()
                ->constrained('users')
                ->restrictOnDelete();
            $table->boolean('flagged_for_admin')->default(false);
            $table->foreignId('flagged_by_user_id')
                ->nullable()
                ->constrained('users')
                ->restrictOnDelete();
            $table->dateTime('flagged_at', 6)->nullable();
            $table->boolean('show_on_disease_pages')->default(true);
            $table->boolean('show_on_organ_pages')->default(true);
            $table->boolean('show_on_system_pages')->default(true);
            $table->boolean('show_on_article_pages')->default(true);
            $table->text('public_display_note')->nullable();
            $table->json('internal_tags')->nullable();
            $table->foreignId('archived_by_user_id')
                ->nullable()
                ->constrained('users')
                ->restrictOnDelete();
            $table->dateTime('archived_at', 6)->nullable();
            $table->timestamps(6);

            $table->foreign(
                ['practitioner_id', 'author_user_id'],
                'testimonials_practitioner_author_fk',
            )->references(['id', 'user_id'])->on('practitioners')->restrictOnDelete();

            $table->foreign(
                ['client_id', 'practitioner_id'],
                'testimonials_client_practitioner_fk',
            )->references(['id', 'practitioner_id'])->on('clients')->restrictOnDelete();

            $table->index(['author_user_id', 'status', 'created_at'], 'testimonials_author_status_created_index');
            $table->index(['practitioner_id', 'status', 'created_at'], 'testimonials_practitioner_status_created_index');
            $table->index(['status', 'submitted_at'], 'testimonials_status_submitted_index');
            $table->index(['status', 'published_at'], 'testimonials_status_published_index');
            $table->index(['flagged_for_admin', 'status', 'submitted_at'], 'testimonials_flag_status_submitted_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('testimonials');
    }
};
