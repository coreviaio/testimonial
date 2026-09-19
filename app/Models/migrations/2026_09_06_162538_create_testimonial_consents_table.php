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
        Schema::create('testimonial_consents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('version_id')->constrained('testimonial_versions')->restrictOnDelete();
            $table->foreignId('accepted_by_user_id')->constrained('users')->restrictOnDelete();
            $table->string('statement_code', 100);
            $table->string('statement_version', 32);
            $table->text('statement_text');
            $table->dateTime('accepted_at', 6);
            $table->timestamp('created_at', 6)->useCurrent();

            $table->unique(['version_id', 'statement_code'], 'tc_version_statement_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('testimonial_consents');
    }
};
