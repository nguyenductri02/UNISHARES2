<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('documents', function (Blueprint $table) {
            // Add group_id column if it doesn't exist
            if (!Schema::hasColumn('documents', 'group_id')) {
                $table->foreignId('group_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('documents', function (Blueprint $table) {
            // Drop foreign key constraint first
            $table->dropForeign(['group_id']);
            // Then drop the column
            $table->dropColumn('group_id');
        });
    }
};
