<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class CreateStorageLink extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'unishare:storage-link';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a symbolic link from public/storage to storage/app/public';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Create the public storage directory if it doesn't exist
        if (!File::exists(storage_path('app/public'))) {
            File::makeDirectory(storage_path('app/public'), 0755, true);
        }
        
        // Create the symbolic link
        if (file_exists(public_path('storage'))) {
            $this->error('The "public/storage" directory already exists.');
            return;
        }
        
        // Create the symlink
        if (symlink(storage_path('app/public'), public_path('storage'))) {
            $this->info('The [public/storage] symbolic link has been created.');
        } else {
            $this->error('Failed to create the symbolic link.');
            
            // For Windows environment, sometimes symlink fails due to permissions
            // We can copy the files instead in that case
            $this->info('Trying to copy files instead...');
            if (File::copyDirectory(storage_path('app/public'), public_path('storage'))) {
                $this->info('Files copied successfully instead of creating a symlink.');
            } else {
                $this->error('Failed to copy files as well.');
            }
        }
    }
}
