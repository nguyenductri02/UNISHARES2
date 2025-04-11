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
        Schema::create('reports', function (Blueprint $table) {
            $table->id();           
            $table->foreignId('reported_by')        ->constrained('users');
            $table->foreignId('reported_user')      ->constrained('users');
            $table->foreignId('document_id')       ->constrained('documents');
            $table->foreignId('comment_id')         ->constrained('comments');
            $table->foreignId('message_id')         ->constrained('messages');
            $table->text('reason');
            $table->char('status_reports', 1)->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
