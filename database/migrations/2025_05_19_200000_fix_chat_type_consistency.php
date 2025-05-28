<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class FixChatTypeConsistency extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update all chats to make sure type and is_group are consistent
        DB::statement("UPDATE chats SET is_group = true WHERE type = 'group'");
        DB::statement("UPDATE chats SET is_group = false WHERE type = 'direct'");
        
        // For any chats that have type='group' but is_group=false (which is inconsistent)
        DB::statement("UPDATE chats SET type = 'direct' WHERE type = 'group' AND is_group = false");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Not reversible
    }
}
