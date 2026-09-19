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
        Schema::create('practitioners', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->restrictOnDelete();
            $table->string('practitioner_type', 50)->nullable();
            $table->string('professional_title', 150)->nullable();
            $table->string('specialty')->nullable();
            $table->text('professional_bio')->nullable();
            $table->string('organization_name')->nullable();
            $table->decimal('years_of_experience', 4, 1)->nullable();
            $table->string('license_number', 150)->nullable();
            $table->string('issuing_authority')->nullable();
            $table->string('registration_jurisdiction', 150)->nullable();
            $table->string('professional_website', 2048)->nullable();
            $table->text('verification_notes')->nullable();
            $table->boolean('show_identity_publicly')->default(false);
            $table->string('public_display_name', 150)->nullable();
            $table->text('public_professional_description')->nullable();
            $table->string('verification_status', 32)->default('draft');
            $table->timestamps(6);

            $table->unique(['id', 'user_id'], 'practitioners_id_user_unique');
            $table->index(['verification_status', 'created_at'], 'practitioners_status_created_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('practitioners');
    }
};
