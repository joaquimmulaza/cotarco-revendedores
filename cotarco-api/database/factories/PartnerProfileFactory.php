<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PartnerProfile>
 */
class PartnerProfileFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'company_name' => fake()->company(),
            'phone_number' => fake()->phoneNumber(),
            'business_model' => fake()->randomElement(['B2B', 'B2C']),
            'alvara_path' => 'alvaras/test_alvara_' . fake()->uuid() . '.pdf',
        ];
    }

    /**
     * Indicate that the partner is B2B.
     */
    public function b2b(): static
    {
        return $this->state(fn (array $attributes) => [
            'business_model' => 'B2B',
        ]);
    }

    /**
     * Indicate that the partner is B2C.
     */
    public function b2c(): static
    {
        return $this->state(fn (array $attributes) => [
            'business_model' => 'B2C',
        ]);
    }

    /**
     * Indicate that the partner has no business model defined.
     */
    public function noBusinessModel(): static
    {
        return $this->state(fn (array $attributes) => [
            'business_model' => null,
        ]);
    }
}
