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
        Schema::create('user_consents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->string('context', 40);
            $table->foreignId('verification_id')
                ->nullable()
                ->constrained('practitioner_verifications')
                ->restrictOnDelete();
            $table->char('acknowledgement_set_id', 36);
            $table->string('statement_code', 100);
            $table->string('statement_version', 32);
            $table->text('statement_text');
            $table->dateTime('accepted_at', 6);
            $table->timestamp('created_at', 6)->useCurrent();

            $table->unique(['acknowledgement_set_id', 'statement_code'], 'uc_set_statement_unique');
            $table->index(['user_id', 'context', 'accepted_at'], 'uc_user_context_accepted_index');
            $table->index('verification_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_consents');
    }
};
