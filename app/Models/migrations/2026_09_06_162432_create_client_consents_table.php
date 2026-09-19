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
        Schema::create('client_consents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->restrictOnDelete();
            $table->foreignId('recorded_by_user_id')->constrained('users')->restrictOnDelete();
            $table->string('action', 20);
            $table->string('statement_version', 32);
            $table->text('statement_text');
            $table->dateTime('occurred_at', 6);
            $table->text('note')->nullable();
            $table->timestamp('created_at', 6)->useCurrent();

            $table->index(['client_id', 'occurred_at', 'id'], 'cc_client_occurred_id_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('client_consents');
    }
};
