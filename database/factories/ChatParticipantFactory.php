<?php

namespace Database\Factories;

use App\Models\ChatParticipant;
use App\Models\User;
use App\Models\Chat;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ChatParticipant>
 */
class ChatParticipantFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = ChatParticipant::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'chat_id' => Chat::factory(),
            'user_id' => User::factory(),
            'is_admin' => false,
            'joined_at' => now(),
            'left_at' => null,
            'last_read_at' => null,
        ];
    }

    /**
     * Indicate that the participant is an admin.
     */
    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_admin' => true,
        ]);
    }

    /**
     * Indicate that the participant has left.
     */
    public function left(): static
    {
        return $this->state(fn (array $attributes) => [
            'left_at' => now(),
        ]);
    }

    /**
     * Set the chat for the participant.
     */
    public function forChat(Chat $chat): static
    {
        return $this->state(fn (array $attributes) => [
            'chat_id' => $chat->id,
        ]);
    }

    /**
     * Set the user for the participant.
     */
    public function forUser(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => $user->id,
        ]);
    }
}
