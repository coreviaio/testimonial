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
        Schema::create('testimonial_biomarkers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('testimonial_id')->constrained('testimonials')->restrictOnDelete();
            $table->unsignedBigInteger('biomarker_id');
            $table->foreignId('created_by_user_id')->constrained('users')->restrictOnDelete();
            $table->timestamps(6);

            $table->unique(['testimonial_id', 'biomarker_id'], 'tb_testimonial_biomarker_unique');
            $table->index(['biomarker_id', 'testimonial_id'], 'tb_biomarker_testimonial_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('testimonial_biomarkers');
    }
};
