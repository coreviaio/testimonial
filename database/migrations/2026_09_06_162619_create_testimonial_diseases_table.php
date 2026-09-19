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
        Schema::create('testimonial_diseases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('testimonial_id')->constrained('testimonials')->restrictOnDelete();
            $table->unsignedBigInteger('disease_id');
            $table->foreignId('created_by_user_id')->constrained('users')->restrictOnDelete();
            $table->timestamps(6);

            $table->unique(['testimonial_id', 'disease_id'], 'td_testimonial_disease_unique');
            $table->index(['disease_id', 'testimonial_id'], 'td_disease_testimonial_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('testimonial_diseases');
    }
};
