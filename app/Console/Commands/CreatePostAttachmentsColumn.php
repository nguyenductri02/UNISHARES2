<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;

class CreatePostAttachmentsColumn extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'posts:fix-attachments';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Add file_upload_id column to post_attachments table if missing';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking post_attachments table...');
        
        if (!Schema::hasTable('post_attachments')) {
            $this->error('post_attachments table does not exist!');
            return Command::FAILURE;
        }
        
        if (Schema::hasColumn('post_attachments', 'file_upload_id')) {
            $this->info('file_upload_id column already exists in post_attachments table.');
            return Command::SUCCESS;
        }
        
        $this->info('Running migration to add file_upload_id column...');
        
        // Run the migration
        Artisan::call('migrate', [
            '--path' => 'database/migrations/2025_05_21_000000_add_file_upload_id_to_post_attachments_table.php',
            '--force' => true,
        ]);
        
        $this->info('Migration completed successfully!');
        
        return Command::SUCCESS;
    }
}
