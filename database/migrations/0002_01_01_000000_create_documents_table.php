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
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')                                 ->nullable();
            $table->string('files');
            $table->foreignId('user_id')->constrained('users');
            $table->string('subject')                                   ->nullable();
            $table->string('university')                                ->nullable();
            $table->boolean('is_official')                              ->default(false);
            $table->char('status', 1)                                   ->default(1);
            $table->integer('download_count')                           ->default(0);
            $table->float('rating')                                     ->default(0);
            $table->integer('rating_count')                             ->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
