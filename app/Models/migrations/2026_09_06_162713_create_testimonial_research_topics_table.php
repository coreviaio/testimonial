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
        Schema::create('testimonial_research_topics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('testimonial_id')
                ->constrained('testimonials', 'id', 'trt_testimonial_fk')
                ->restrictOnDelete();
            $table->unsignedBigInteger('research_topic_id');
            $table->foreignId('created_by_user_id')
                ->constrained('users', 'id', 'trt_creator_fk')
                ->restrictOnDelete();
            $table->timestamps(6);

            $table->unique(['testimonial_id', 'research_topic_id'], 'trt_testimonial_topic_unique');
            $table->index(['research_topic_id', 'testimonial_id'], 'trt_topic_testimonial_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('testimonial_research_topics');
    }
};
