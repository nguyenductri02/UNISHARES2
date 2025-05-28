<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Chat;
use App\Models\User;
use App\Models\Message;
use App\Models\MessageAttachment;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class ChatSystemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $faker = Faker::create();
          // Clean existing data
        $this->command->info('Cleaning existing chat data...');
        
        // Disable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        
        // Truncate tables in reverse order of dependencies
        DB::table('message_attachments')->truncate();
        DB::table('messages')->truncate();
        DB::table('chat_participants')->truncate();
        DB::table('chats')->truncate();
        
        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1');
        
        // Get some users
        $users = User::take(10)->get();
        
        if ($users->count() < 3) {
            $this->command->error('Not enough users in the database. Please seed users first.');
            return;
        }
        
        $this->command->info('Creating sample chats...');
        
        // Create some direct chats
        for ($i = 0; $i < 5; $i++) {
            $user1 = $users->random();
            $user2 = $users->except($user1->id)->random();
              $chat = Chat::create([
                'type' => 'direct',
                'is_group' => false,
                'created_by' => $user1->id,
                'last_message_at' => now()->subMinutes(rand(1, 1000)),
            ]);
            
            // Add participants
            $chat->addParticipant($user1->id, true);
            $chat->addParticipant($user2->id, false);
            
            $this->command->info("Created direct chat between {$user1->name} and {$user2->name}");
            
            // Create some messages
            $this->createMessages($chat, [$user1, $user2], rand(3, 10));
        }
        
        // Create some group chats
        for ($i = 0; $i < 3; $i++) {
            $members = $users->random(rand(3, 6));
            $creator = $members->first();
            
            $chat = Chat::create([
                'name' => $faker->words(rand(2, 4), true) . ' Group',
                'type' => 'group',
                'is_group' => true,
                'created_by' => $creator->id,
                'description' => $faker->sentence(),
                'last_message_at' => now()->subMinutes(rand(1, 1000)),
            ]);
            
            // Add participants
            foreach ($members as $index => $member) {
                $chat->addParticipant($member->id, $index === 0); // First user is admin
            }
            
            $this->command->info("Created group chat '{$chat->name}' with " . $members->count() . " members");
            
            // Create some messages
            $this->createMessages($chat, $members, rand(5, 20));
        }
        
        $this->command->info('Chat system seeding complete!');
    }
    
    /**
     * Create random messages for a chat
     */
    private function createMessages($chat, $users, $count)
    {
        $faker = Faker::create();
        
        for ($i = 0; $i < $count; $i++) {
            $user = $users[array_rand($users->toArray())];
            $createdAt = $faker->dateTimeBetween('-1 month', 'now');
            
            $message = $chat->messages()->create([
                'user_id' => $user->id,
                'content' => $faker->realText(rand(10, 200)),
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
            
            // Randomly add an attachment (20% chance)
            if (rand(1, 5) === 1) {
                $isImage = rand(0, 1) === 1;
                $extension = $isImage ? 'jpg' : 'pdf';
                $fileType = $isImage ? 'image/jpeg' : 'application/pdf';
                $fileName = $faker->word . '.' . $extension;
                
                MessageAttachment::create([
                    'message_id' => $message->id,
                    'file_name' => $fileName,
                    'file_path' => 'attachments/samples/' . $fileName,
                    'file_size' => rand(10000, 5000000), // 10KB to 5MB
                    'file_type' => $fileType,
                ]);
            }
        }
        
        // Update last_message_at timestamp
        $chat->update(['last_message_at' => $chat->messages()->latest()->first()->created_at]);
    }
}
