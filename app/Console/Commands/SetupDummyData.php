<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class SetupDummyData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'unishare:setup-dummy';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Set up dummy data for the UNISHARE platform';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Setting up dummy data for the UNISHARE platform...');

        // Create storage link if it doesn't exist
        if (!file_exists(public_path('storage'))) {
            $this->info('Creating storage symbolic link...');
            Artisan::call('storage:link');
            $this->info('Storage link created successfully.');
        }

        // Create directories structure
        $this->createDirectoryStructure();

        // Copy document icons if they exist in public folder
        $this->copyDocumentIcons();

        // Generate other dummy images if needed
        $this->info('Generating remaining dummy images...');
        Artisan::call('db:seed', [
            '--class' => 'Database\\Seeders\\DummyImagesSeeder',
        ]);
        
        // Run the migration to add missing columns if needed
        $this->info('Running migrations for document fields...');
        Artisan::call('migrate', [
            '--path' => 'database/migrations/2023_10_10_000001_add_type_status_price_to_documents.php',
        ]);
        
        // Seed dummy documents
        $this->info('Seeding dummy documents...');
        Artisan::call('db:seed', [
            '--class' => 'Database\\Seeders\\DummyDocumentsSeeder',
        ]);
        
        $this->info('Dummy images generated successfully.');
        $this->info('');
        $this->info('Dummy data setup complete!');
        $this->info('');
        $this->info('The HomeController has been updated to provide dummy data when real data is unavailable.');
        $this->info('You can now access all the home API endpoints without needing to populate the database first.');
        
        return Command::SUCCESS;
    }

    /**
     * Create the directory structure for storing files
     */
    private function createDirectoryStructure()
    {
        $this->info('Creating directory structure...');
        
        $directories = [
            'blog', 
            'courses', 
            'documents', 
            'avatars',
            'group-icons'
        ];
        
        foreach ($directories as $dir) {
            if (!Storage::disk('public')->exists($dir)) {
                Storage::disk('public')->makeDirectory($dir, 0775, true);
                $this->info("Created directory: {$dir}");
            } else {
                $this->info("Directory already exists: {$dir}");
            }
        }
        
        // Create sample files for the frontend
        $this->createSampleFiles();
    }

    /**
     * Create sample files for the homepage components
     */
    private function createSampleFiles()
    {
        $this->info('Creating sample files for frontend components...');
        
        // Sample course images 
        $this->createSampleImages('courses', [
            'course1.jpg' => '#3498db',  // Blue
            'course2.jpg' => '#2ecc71',  // Green
            'course3.jpg' => '#e74c3c',  // Red
            'course4.jpg' => '#f39c12',  // Orange
        ]);
        
        // Sample blog post images
        $this->createSampleImages('blog', [
            'post1.jpg' => '#8e44ad',   // Purple
            'post2.jpg' => '#27ae60',   // Emerald
            'post3.jpg' => '#f1c40f',   // Yellow
            'post4.jpg' => '#e67e22',   // Orange
        ]);
        
        $this->info('Sample files created successfully.');
    }
    
    /**
     * Create sample images with the given colors
     */
    private function createSampleImages($directory, $images)
    {
        foreach ($images as $filename => $color) {
            $this->generateImage(
                storage_path("app/public/{$directory}/{$filename}"),
                $color,
                ucwords(str_replace(['-', '.jpg', '.png'], [' ', '', ''], $filename))
            );
            $this->info("Created image: {$directory}/{$filename}");
        }
    }
    
    /**
     * Generate a simple colored image with text
     */
    private function generateImage($path, $bgColor, $text = 'UNISHARE')
    {
        // Create a 400x300 image
        $width = 400;
        $height = 300;
        $image = imagecreatetruecolor($width, $height);
        
        // Background color
        $rgb = $this->hex2rgb($bgColor);
        $backgroundColor = imagecolorallocate($image, $rgb[0], $rgb[1], $rgb[2]);
        
        // Text color (white)
        $textColor = imagecolorallocate($image, 255, 255, 255);
        
        // Fill the background
        imagefilledrectangle($image, 0, 0, $width-1, $height-1, $backgroundColor);
        
        // Add centered text
        $fontSize = 4;
        $textWidth = imagefontwidth($fontSize) * strlen($text);
        $textHeight = imagefontheight($fontSize);
        $centerX = ($width - $textWidth) / 2;
        $centerY = ($height - $textHeight) / 2;
        
        imagestring($image, $fontSize, $centerX, $centerY, $text, $textColor);
        
        // Add UNISHARE text at the bottom
        $brandText = "UNISHARE";
        $brandTextWidth = imagefontwidth($fontSize) * strlen($brandText);
        $brandX = ($width - $brandTextWidth) / 2;
        imagestring($image, $fontSize, $brandX, $height - 30, $brandText, $textColor);
        
        // Save the image
        $directory = dirname($path);
        if (!File::exists($directory)) {
            File::makeDirectory($directory, 0755, true);
        }
        
        imagejpeg($image, $path, 90);
        imagedestroy($image);
    }
    
    /**
     * Convert hex color to RGB values
     */
    private function hex2rgb($hex) {
        $hex = str_replace("#", "", $hex);
        
        if(strlen($hex) == 3) {
            $r = hexdec(substr($hex, 0, 1).substr($hex, 0, 1));
            $g = hexdec(substr($hex, 1, 1).substr($hex, 1, 1));
            $b = hexdec(substr($hex, 2, 1).substr($hex, 2, 1));
        } else {
            $r = hexdec(substr($hex, 0, 2));
            $g = hexdec(substr($hex, 2, 2));
            $b = hexdec(substr($hex, 4, 2));
        }
        
        return array($r, $g, $b);
    }

    /**
     * Copy document icons from public folder if they exist
     */
    private function copyDocumentIcons()
    {
        $this->info('Copying document icons...');
        
        $documentIcons = [
            'doc.png', 
            'pdf.png', 
            'ppt.png', 
            'txt.png', 
            'xls.png', 
            'zip.png'
        ];
        
        // Source directory from the project structure shown in your image
        $sourceDirectory = base_path('public/documents');
        
        if (!File::exists($sourceDirectory)) {
            $this->warn('Document icons source directory not found: ' . $sourceDirectory);
            return;
        }
        
        // Destination is the storage/public/documents directory
        $destinationDirectory = storage_path('app/public/documents');
        
        // Ensure the destination directory exists
        if (!File::exists($destinationDirectory)) {
            File::makeDirectory($destinationDirectory, 0775, true);
        }
        
        foreach ($documentIcons as $icon) {
            $source = $sourceDirectory . '/' . $icon;
            $destination = $destinationDirectory . '/' . $icon;
            
            if (File::exists($source)) {
                File::copy($source, $destination);
                $this->info("Copied: {$icon}");
            } else {
                $this->warn("Source icon not found: {$icon}");
            }
        }
    }
}
