<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Group;
use App\Models\GroupMember;
use App\Models\Chat;
use App\Models\ChatParticipant;
use Laravel\Sanctum\Sanctum;

class GroupChatPermissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_group_member_can_access_group_chat()
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

        // Authenticate the user
        Sanctum::actingAs($user);        // Test that the user can access the chat
        $response = $this->getJson("/api/chats/{$chat->id}");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        'id',
                        'name',
                        'is_group',
                        'type',
                    ]
                ]);

        // Verify that the user was automatically added as a participant
        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $chat->id,
            'user_id' => $user->id,
        ]);
    }

    public function test_non_group_member_cannot_access_group_chat()
    {
        // Create two users
        $groupMember = User::factory()->create([
            'name' => 'Group Member',
            'email' => 'member@example.com',
        ]);

        $outsider = User::factory()->create([
            'name' => 'Outsider',
            'email' => 'outsider@example.com',
        ]);

        // Create a test group
        $group = Group::factory()->create([
            'name' => 'Test Group',
            'description' => 'A test group',
            'creator_id' => $groupMember->id,
        ]);

        // Add only the first user as a member
        GroupMember::create([
            'group_id' => $group->id,
            'user_id' => $groupMember->id,
            'role' => 'admin',
            'status' => 'approved',
        ]);

        // Create a chat for the group
        $chat = Chat::create([
            'name' => $group->name . ' Chat',
            'type' => 'group',
            'is_group' => true,
            'group_id' => $group->id,
            'created_by' => $groupMember->id,
        ]);

        // Authenticate the outsider
        Sanctum::actingAs($outsider);

        // Test that the outsider cannot access the chat
        $response = $this->getJson("/api/chats/{$chat->id}");

        $response->assertStatus(403)
                ->assertJson([
                    'message' => 'You are not a member of this group'
                ]);

        // Verify that the outsider was NOT added as a participant
        $this->assertDatabaseMissing('chat_participants', [
            'chat_id' => $chat->id,
            'user_id' => $outsider->id,
        ]);
    }

    public function test_group_member_can_send_messages_to_group_chat()
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

        // Authenticate the user
        Sanctum::actingAs($user);

        // Test that the user can send a message
        $response = $this->postJson("/api/chats/{$chat->id}/messages", [
            'content' => 'Hello, group!'
        ]);

        $response->assertStatus(200);

        // Verify the message was created
        $this->assertDatabaseHas('messages', [
            'chat_id' => $chat->id,
            'user_id' => $user->id,
            'content' => 'Hello, group!',
        ]);

        // Verify that the user was automatically added as a participant
        $this->assertDatabaseHas('chat_participants', [
            'chat_id' => $chat->id,
            'user_id' => $user->id,
        ]);
    }
}
