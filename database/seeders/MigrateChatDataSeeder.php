<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Chat;
use App\Models\User;
use App\Models\Message;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class MigrateChatDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Check if both old and new structure exists
        if (!Schema::hasTable('chats') || 
            !Schema::hasTable('chat_participants')) {
            $this->command->error('Required tables do not exist');
            return;
        }

        // Find all chats that have user1_id and user2_id columns with values
        $oldChats = DB::table('chats')
            ->whereNotNull('user1_id')
            ->whereNotNull('user2_id')
            ->get();

        if ($oldChats->isEmpty()) {
            $this->command->info('No old chat data found to migrate');
            return;
        }

        $this->command->info("Found {$oldChats->count()} chats to migrate");

        // Process each chat
        foreach ($oldChats as $oldChat) {
            try {
                // Start a database transaction
                DB::beginTransaction();

                // Update the existing chat record
                $chat = Chat::find($oldChat->id);
                if (!$chat) {
                    $this->command->error("Chat with ID {$oldChat->id} not found");
                    continue;
                }

                $this->command->info("Migrating chat ID: {$chat->id}");

                // Update chat properties
                $chat->update([
                    'type' => 'direct',
                    'is_group' => false,
                    'created_by' => $oldChat->user1_id,
                    'last_message_at' => $chat->updated_at,
                ]);

                // Add participants
                $user1 = User::find($oldChat->user1_id);
                $user2 = User::find($oldChat->user2_id);

                if ($user1) {
                    $chat->addParticipant($user1->id, true);
                    $this->command->info("Added user1: {$user1->name}");
                }

                if ($user2) {
                    $chat->addParticipant($user2->id, false);
                    $this->command->info("Added user2: {$user2->name}");
                }

                // Fix message sender_id to user_id if needed
                if (Schema::hasColumn('messages', 'sender_id') && !Schema::hasColumn('messages', 'user_id')) {
                    $messages = DB::table('messages')
                        ->where('chat_id', $chat->id)
                        ->get();

                    foreach ($messages as $message) {
                        DB::table('messages')
                            ->where('id', $message->id)
                            ->update(['user_id' => $message->sender_id]);
                    }

                    $this->command->info("Updated {$messages->count()} messages for chat {$chat->id}");
                }

                // Commit the transaction
                DB::commit();
                $this->command->info("Successfully migrated chat ID: {$chat->id}");
            } catch (\Exception $e) {
                // Rollback in case of error
                DB::rollBack();
                $this->command->error("Error migrating chat ID {$oldChat->id}: {$e->getMessage()}");
            }
        }

        $this->command->info('Chat data migration completed');
    }
}
