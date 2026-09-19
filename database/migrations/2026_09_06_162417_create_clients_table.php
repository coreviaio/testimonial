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
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('practitioner_id')->constrained('practitioners')->restrictOnDelete();
            $table->string('client_reference', 50)->unique();
            $table->string('name', 200);
            $table->string('email', 254)->nullable();
            $table->string('phone', 30)->nullable();
            $table->date('date_of_birth')->nullable();
            $table->unsignedSmallInteger('age_years')->nullable();
            $table->date('age_recorded_on')->nullable();
            $table->string('gender', 32)->nullable();
            $table->char('country_code', 2)->nullable();
            $table->text('private_notes')->nullable();
            $table->string('status', 20)->default('active');
            $table->foreignId('created_by_user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('archived_by_user_id')
                ->nullable()
                ->constrained('users')
                ->restrictOnDelete();
            $table->dateTime('archived_at', 6)->nullable();
            $table->timestamps(6);

            $table->unique(['id', 'practitioner_id'], 'clients_id_practitioner_unique');
            $table->index(['practitioner_id', 'status', 'created_at'], 'clients_practitioner_status_created_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
