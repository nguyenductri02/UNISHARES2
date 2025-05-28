<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Doctrine\DBAL\Types\Type;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Ensure doctrine/dbal is available for column modifications
        if (!Schema::hasTable('post_attachments')) {
            // If table doesn't exist, we don't need to do anything
            return;
        }

        // Check if file_hash column exists
        if (Schema::hasColumn('post_attachments', 'file_hash')) {
            try {
                // Make the file_hash column nullable first
                Schema::table('post_attachments', function (Blueprint $table) {
                    $table->string('file_hash')->nullable()->change();
                });
                
                // Update NULL values with a generated hash
                DB::statement("UPDATE post_attachments SET file_hash = CONCAT(MD5(CONCAT(IFNULL(file_name,''), IFNULL(file_path,''))), '-', id) WHERE file_hash IS NULL");
                
                // Make it non-nullable after populating
                Schema::table('post_attachments', function (Blueprint $table) {
                    $table->string('file_hash')->nullable(false)->change();
                });
            } catch (\Exception $e) {
                // Log the error but continue
                \Log::error('Error updating file_hash column: ' . $e->getMessage());
            }
        } else {
            // Add the file_hash column if it doesn't exist
            try {
                Schema::table('post_attachments', function (Blueprint $table) {
                    $table->string('file_hash')->nullable();
                });
                
                // Update with generated hash - with NULL handling
                DB::statement("UPDATE post_attachments SET file_hash = CONCAT(MD5(CONCAT(IFNULL(file_name,''), IFNULL(file_path,''))), '-', id)");
                
                // Make it non-nullable after populating
                Schema::table('post_attachments', function (Blueprint $table) {
                    $table->string('file_hash')->nullable(false)->change();
                });
            } catch (\Exception $e) {
                // Log the error but continue
                \Log::error('Error adding file_hash column: ' . $e->getMessage());
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We don't want to remove the column since it's essential
        // But we can make it nullable in case of rollback
        if (Schema::hasTable('post_attachments') && Schema::hasColumn('post_attachments', 'file_hash')) {
            try {
                Schema::table('post_attachments', function (Blueprint $table) {
                    $table->string('file_hash')->nullable()->change();
                });
            } catch (\Exception $e) {
                \Log::error('Error modifying file_hash column in down migration: ' . $e->getMessage());
            }
        }
    }
};
