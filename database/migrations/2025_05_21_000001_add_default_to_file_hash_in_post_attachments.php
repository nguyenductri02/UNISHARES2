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
        // Alter the post_attachments table to make file_hash nullable or add a default
        Schema::table('post_attachments', function (Blueprint $table) {
            // Make the file_hash nullable
            $table->string('file_hash')->nullable()->change();
        });
        
        // Update existing records with empty file_hash
        DB::statement("UPDATE post_attachments SET file_hash = CONCAT(MD5(RAND()), '-', id) WHERE file_hash IS NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('post_attachments', function (Blueprint $table) {
            // Make file_hash required again
            $table->string('file_hash')->nullable(false)->change();
        });
    }
};
