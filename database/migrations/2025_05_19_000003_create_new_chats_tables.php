<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateNewChatsTables extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create chats table
        if (!Schema::hasTable('chats')) {
            Schema::create('chats', function (Blueprint $table) {
                $table->id();
                $table->string('name')->nullable();
                $table->enum('type', ['direct', 'group'])->default('direct');
                $table->foreignId('created_by')->nullable()->constrained('users');
                $table->boolean('is_group')->default(false);
                $table->text('description')->nullable();
                $table->string('avatar')->nullable();
                $table->timestamp('last_message_at')->nullable();
                $table->foreignId('group_id')->nullable()->constrained('groups')->onDelete('cascade');
                $table->timestamps();
            });
        }

        // Create chat_participants table
        if (!Schema::hasTable('chat_participants')) {
            Schema::create('chat_participants', function (Blueprint $table) {
                $table->id();
                $table->foreignId('chat_id')->constrained()->onDelete('cascade');
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->boolean('is_admin')->default(false);
                $table->timestamp('joined_at')->useCurrent();
                $table->timestamp('left_at')->nullable();
                $table->timestamp('last_read_at')->nullable();
                $table->timestamps();
                
                // Add unique constraint to prevent duplicate participants
                $table->unique(['chat_id', 'user_id']);
            });
        }

        // Create messages table if it doesn't exist
        if (!Schema::hasTable('messages')) {
            Schema::create('messages', function (Blueprint $table) {
                $table->id();
                $table->foreignId('chat_id')->constrained()->onDelete('cascade');
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->text('content');
                $table->timestamps();
            });
        }

        // Create message_attachments table
        if (!Schema::hasTable('message_attachments')) {
            Schema::create('message_attachments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('message_id')->constrained()->onDelete('cascade');
                $table->string('file_name');
                $table->string('file_path');
                $table->unsignedBigInteger('file_size')->nullable();
                $table->string('file_type')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('message_attachments');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('chat_participants');
        Schema::dropIfExists('chats');
    }
}
