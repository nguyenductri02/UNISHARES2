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
        Schema::create('user_mentor_mentee', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mentor_id')->constrained('users');
            $table->foreignId('mentee_id')->constrained('users');
            $table->string('subject')                                                   ->nullable();
            $table->char('status_user_mentor_mentee', 1)->default(1);
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_mentor_mentee');
    }
};
