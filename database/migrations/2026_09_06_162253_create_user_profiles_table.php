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
        Schema::create('user_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->restrictOnDelete();
            $table->string('display_name', 150)->nullable();
            $table->string('phone', 30)->nullable();
            $table->char('country_code', 2)->nullable();
            $table->string('city', 150)->nullable();
            $table->string('profile_photo_path', 1024)->nullable();
            $table->text('short_bio')->nullable();
            $table->boolean('is_public')->default(false);
            $table->timestamps(6);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_profiles');
    }
};
