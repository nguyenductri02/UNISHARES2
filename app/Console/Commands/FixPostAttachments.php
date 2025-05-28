<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\PostAttachment;

class FixPostAttachments extends Command
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
    protected $description = 'Fix post attachments by adding missing file_hash values';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking post attachments...');
        
        $count = PostAttachment::whereNull('file_hash')->count();
        $this->info("Found {$count} attachment records without file_hash");
        
        if ($count > 0) {
            $this->info('Updating records with generated hash values...');
            
            // Update in batches to avoid timeouts
            PostAttachment::whereNull('file_hash')
                ->chunkById(100, function($attachments) {
                    foreach ($attachments as $attachment) {
                        // Generate a unique hash
                        $hash = md5($attachment->file_path . $attachment->file_name . $attachment->id);
                        $attachment->file_hash = $hash;
                        $attachment->save();
                        
                        $this->line("Fixed attachment ID: {$attachment->id}");
                    }
                });
            
            $this->info('Post attachments have been fixed successfully!');
        } else {
            $this->info('No attachments need to be fixed.');
        }
        
        return Command::SUCCESS;
    }
}
