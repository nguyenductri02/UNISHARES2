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
        Schema::table('documents', function (Blueprint $table) {
            // Add type column for document/course distinction if it doesn't exist
            if (!Schema::hasColumn('documents', 'type')) {
                $table->string('type')->default('document')->after('view_count');
            }
            
            // Add status column if it doesn't exist
            if (!Schema::hasColumn('documents', 'status')) {
                $table->string('status')->default('pending')->after('type');
            }
            
            // Add foreign key for group_id if it doesn't exist
            if (!Schema::hasColumn('documents', 'group_id')) {
                $table->foreignId('group_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
            }
        });

        // Ensure existing documents have appropriate values
        DB::table('documents')->whereNull('status')->update(['status' => 'approved']);
        DB::table('documents')->whereNull('type')->update(['type' => 'document']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            // Remove the columns if they exist
            if (Schema::hasColumn('documents', 'type')) {
                $table->dropColumn('type');
            }
            
            if (Schema::hasColumn('documents', 'status')) {
                $table->dropColumn('status');
            }
            
        });
    }
};
