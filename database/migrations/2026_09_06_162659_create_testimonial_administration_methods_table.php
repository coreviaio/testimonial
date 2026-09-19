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
        Schema::create('testimonial_administration_methods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('testimonial_id')
                ->constrained('testimonials', 'id', 'tam_testimonial_fk')
                ->restrictOnDelete();
            $table->unsignedBigInteger('administration_method_id');
            $table->foreignId('created_by_user_id')
                ->constrained('users', 'id', 'tam_creator_fk')
                ->restrictOnDelete();
            $table->timestamps(6);

            $table->unique(['testimonial_id', 'administration_method_id'], 'tam_testimonial_method_unique');
            $table->index(['administration_method_id', 'testimonial_id'], 'tam_method_testimonial_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('testimonial_administration_methods');
    }
};
