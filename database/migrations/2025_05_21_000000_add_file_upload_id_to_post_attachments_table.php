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
        // Check if the column doesn't exist before adding it
        if (!Schema::hasColumn('post_attachments', 'file_upload_id')) {
            Schema::table('post_attachments', function (Blueprint $table) {
                $table->unsignedBigInteger('file_upload_id')->nullable()->after('post_id');
                // Add foreign key
                $table->foreign('file_upload_id')
                      ->references('id')
                      ->on('file_uploads')
                      ->onDelete('set null');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('post_attachments', function (Blueprint $table) {
            if (Schema::hasColumn('post_attachments', 'file_upload_id')) {
                $table->dropForeign(['file_upload_id']);
                $table->dropColumn('file_upload_id');
            }
        });
    }
};
