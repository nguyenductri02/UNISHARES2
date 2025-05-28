<?php

namespace Database\Factories;

use App\Models\Group;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Group>
 */
class GroupFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Group::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->words(3, true),
            'description' => fake()->paragraph(),
            'avatar' => null,
            'cover_image' => null,
            'creator_id' => User::factory(),
            'created_by' => null,
            'course_code' => fake()->optional()->bothify('??###'),
            'university' => fake()->optional()->company(),
            'department' => fake()->optional()->words(2, true),
            'type' => fake()->randomElement(['course', 'university', 'interest', 'public', 'private']),
            'requires_approval' => fake()->boolean(30), // 30% chance of requiring approval
            'member_count' => 1,
        ];
    }

    /**
     * Indicate that the group is a course group.
     */
    public function course(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'course',
            'course_code' => fake()->bothify('??###'),
            'university' => fake()->company(),
            'department' => fake()->words(2, true),
        ]);
    }

    /**
     * Indicate that the group is a university group.
     */
    public function university(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'university',
            'university' => fake()->company(),
            'department' => fake()->words(2, true),
        ]);
    }

    /**
     * Indicate that the group is an interest group.
     */
    public function interest(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'interest',
            'course_code' => null,
            'university' => null,
            'department' => null,
        ]);
    }

    /**
     * Indicate that the group is public.
     */
    public function public(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'public',
            'requires_approval' => false,
        ]);
    }

    /**
     * Indicate that the group is private.
     */
    public function private(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'private',
            'requires_approval' => true,
        ]);
    }

    /**
     * Indicate that the group requires approval.
     */
    public function requiresApproval(): static
    {
        return $this->state(fn (array $attributes) => [
            'requires_approval' => true,
        ]);
    }
}
