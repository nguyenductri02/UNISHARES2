<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            
            $table->id();
            $table->string('user_name');
            $table->string('password');

            $table->string('email')                             ->unique();
            // $table->string('password_hash');
            $table->string('phone');
            $table->string('address');
            $table->char('role', 1)                           ->default(1);
            $table->string('full_name')                         ->nullable();
            $table->string('university')                        ->nullable();
            $table->string('major')                             ->nullable();
            $table->string('profile_picture_url')               ->nullable();
            $table->boolean('is_verified')                      ->default(false);
            $table->string('code')                              ->nullable();  
            $table->timestamp('time_code')                      ->nullable(); 
            $table->integer('contribution_points')              ->default(0);
            $table->string('avatar')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
