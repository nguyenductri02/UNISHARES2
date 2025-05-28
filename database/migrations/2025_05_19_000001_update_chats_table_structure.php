<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UpdateChatsTableStructure extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('chats', function (Blueprint $table) {
            // First, check if the old columns exist and drop them if they do
            if (Schema::hasColumn('chats', 'user1_id')) {
                $table->dropColumn('user1_id');
            }
            
            if (Schema::hasColumn('chats', 'user2_id')) {
                $table->dropColumn('user2_id');
            }
            
            // Now add the new columns if they don't exist
            if (!Schema::hasColumn('chats', 'name')) {
                $table->string('name')->nullable();
            }
              if (!Schema::hasColumn('chats', 'type')) {
                $table->enum('type', ['direct', 'group'])->default('direct');
            }
            
            if (!Schema::hasColumn('chats', 'created_by')) {
                $table->foreignId('created_by')->nullable()->constrained('users');
            }
            
            if (!Schema::hasColumn('chats', 'is_group')) {
                $table->boolean('is_group')->default(false);
            }
            
            if (!Schema::hasColumn('chats', 'description')) {
                $table->text('description')->nullable();
            }
            
            if (!Schema::hasColumn('chats', 'avatar')) {
                $table->string('avatar')->nullable();
            }
            
            if (!Schema::hasColumn('chats', 'last_message_at')) {
                $table->timestamp('last_message_at')->nullable();
            }
            
            if (!Schema::hasColumn('chats', 'group_id')) {
                $table->foreignId('group_id')->nullable()->constrained('groups')->onDelete('cascade');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chats', function (Blueprint $table) {
            // Add back the old columns
            $table->foreignId('user1_id')->nullable()->constrained('users');
            $table->foreignId('user2_id')->nullable()->constrained('users');
            
            // Drop the new columns
            $table->dropColumn([
                'name',
                'type',
                'created_by',
                'is_group',
                'description',
                'avatar',
                'last_message_at',
                'group_id'
            ]);
        });
    }
}
