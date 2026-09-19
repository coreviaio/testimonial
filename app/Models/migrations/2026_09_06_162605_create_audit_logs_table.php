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
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_user_id')
                ->nullable()
                ->constrained('users')
                ->restrictOnDelete();
            $table->string('action', 100);
            $table->string('subject_type', 80);
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->json('metadata')->nullable();
            $table->char('request_id', 36)->nullable();
            $table->dateTime('occurred_at', 6);
            $table->timestamp('created_at', 6)->useCurrent();

            $table->index(['subject_type', 'subject_id', 'occurred_at'], 'al_subject_occurred_index');
            $table->index(['actor_user_id', 'occurred_at'], 'al_actor_occurred_index');
            $table->index(['action', 'occurred_at'], 'al_action_occurred_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
