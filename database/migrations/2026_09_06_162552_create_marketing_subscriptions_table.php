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
        Schema::create('marketing_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->string('email', 254);
            $table->string('list_code', 50);
            $table->string('status', 20)->default('unsubscribed');
            $table->string('consent_version', 32)->nullable();
            $table->text('consent_text')->nullable();
            $table->string('source', 50);
            $table->dateTime('subscribed_at', 6)->nullable();
            $table->dateTime('unsubscribed_at', 6)->nullable();
            $table->string('provider_name', 50)->nullable();
            $table->string('external_contact_id', 191)->nullable();
            $table->string('sync_status', 20)->default('not_configured');
            $table->dateTime('last_synced_at', 6)->nullable();
            $table->text('last_sync_error')->nullable();
            $table->timestamps(6);

            $table->unique(['user_id', 'list_code'], 'ms_user_list_unique');
            $table->unique(['email', 'list_code'], 'ms_email_list_unique');
            $table->index(['status', 'sync_status'], 'ms_status_sync_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('marketing_subscriptions');
    }
};
