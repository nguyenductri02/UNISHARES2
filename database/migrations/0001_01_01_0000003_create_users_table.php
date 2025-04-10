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
            //$table->string('user_name')                    ->nullable();
            $table->string('full_name');
            $table->string('password');
            $table->string('email')                             ->unique();
            $table->string('phone');
            $table->string('address')                           ->nullable();
            $table->date('dob')                                 ->nullable();
            $table->char('role', 1)                           ->default(1);
            $table->string('gender')                        ->nullable();
            $table->string('university')                        ->nullable();
            $table->string('major')                             ->nullable();
            $table->string('profile_picture_url')               ->nullable();
            $table->char('is_verified', 1)                      ->default(1);
            $table->string('code')                              ->nullable();
            $table->timestamp('time_code')                      ->nullable();
            $table->integer('contribution_points')              ->default(0);
            $table->string('avatar')->nullable();
            $table->string('files')->nullable();
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


// 'major' => 'nullable|string|max:255', → Ngành học 

// 'profile_picture_url' => 'nullable|url', → URL ảnh đại diện 

// 'is_verified' => 'boolean', → Trạng thái xác thực 

// 'contribution_points' => 'integer|min:0', → Điểm đóng góp 