<?php

namespace Database\Factories;

use App\Models\Chat;
use App\Models\User;
use App\Models\Group;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Chat>
 */
class ChatFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Chat::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->words(3, true),
            'type' => 'direct',
            'created_by' => User::factory(),
            'is_group' => false,
            'description' => fake()->optional()->sentence(),
            'avatar' => null,
            'last_message_at' => null,
            'group_id' => null,
        ];
    }

    /**
     * Indicate that the chat is a group chat.
     */
    public function group(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'group',
            'is_group' => true,
            'group_id' => Group::factory(),
        ]);
    }

    /**
     * Indicate that the chat is a direct message.
     */
    public function direct(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'direct',
            'is_group' => false,
            'group_id' => null,
        ]);
    }

    /**
     * Set the group for the chat.
     */
    public function forGroup(Group $group): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'group',
            'is_group' => true,
            'group_id' => $group->id,
            'name' => $group->name . ' Chat',
        ]);
    }
}
