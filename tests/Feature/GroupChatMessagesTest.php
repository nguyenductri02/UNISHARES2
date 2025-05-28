<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Group;
use App\Models\GroupMember;
use App\Models\Chat;
use App\Models\Message;
use Laravel\Sanctum\Sanctum;

class GroupChatMessagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_group_member_can_view_group_chat_messages()
    {
        // Create a test user
        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        // Create a test group
        $group = Group::factory()->create([
            'name' => 'Test Group',
            'description' => 'A test group',
            'creator_id' => $user->id,
        ]);

        // Add user as a member of the group
        GroupMember::create([
            'group_id' => $group->id,
            'user_id' => $user->id,
            'role' => 'member',
            'status' => 'approved',
        ]);

        // Create a chat for the group
        $chat = Chat::create([
            'name' => $group->name . ' Chat',
            'type' => 'group',
            'is_group' => true,
            'group_id' => $group->id,
            'created_by' => $user->id,
        ]);

        // Create some test messages
        Message::create([
            'chat_id' => $chat->id,
            'user_id' => $user->id,
            'content' => 'First message in group chat',
        ]);

        Message::create([
            'chat_id' => $chat->id,
            'user_id' => $user->id,
            'content' => 'Second message in group chat',
        ]);

        // Authenticate the user
        Sanctum::actingAs($user);

        // Test that the user can view messages
        $response = $this->getJson("/api/chats/{$chat->id}/messages");

        echo "Response status: " . $response->status() . "\n";
        echo "Response content: " . $response->getContent() . "\n";

        $response->assertStatus(200);

        $responseData = $response->json();
        
        // Check if messages are returned in correct format
        if (isset($responseData['data'])) {
            $messages = $responseData['data'];
            $this->assertIsArray($messages, 'Messages should be an array');
            $this->assertCount(2, $messages, 'Should return 2 messages');
            
            // Check message content
            $messageContents = collect($messages)->pluck('content')->toArray();
            $this->assertContains('First message in group chat', $messageContents);
            $this->assertContains('Second message in group chat', $messageContents);
        } else {
            $this->fail('Response should have data property: ' . json_encode($responseData));
        }

        // Verify that the user was automatically added as a participant
        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $chat->id,
            'user_id' => $user->id,
        ]);
    }
}
