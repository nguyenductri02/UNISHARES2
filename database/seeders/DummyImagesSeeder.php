<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class DummyImagesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create dummy directories if they don't exist
        Storage::disk('public')->makeDirectory('blog', 0775, true);
        Storage::disk('public')->makeDirectory('courses', 0775, true);
        Storage::disk('public')->makeDirectory('documents', 0775, true);
        
        // Define colors for dummy images based on actual file structure
        $colors = [
            // Course images
            'courses/course1.jpg' => '#3498db',    // Blue
            'courses/course2.jpg' => '#2ecc71',    // Green
            'courses/course3.jpg' => '#e74c3c',    // Red
            'courses/course4.jpg' => '#f39c12',    // Orange
            
            // Document images - using document icons
            'documents/doc.png' => '#9b59b6',      // Purple
            'documents/pdf.png' => '#1abc9c',      // Turquoise
            'documents/ppt.png' => '#d35400',      // Pumpkin
            'documents/txt.png' => '#c0392b',      // Pomegranate
            'documents/xls.png' => '#16a085',      // Green Sea
            'documents/zip.png' => '#2980b9',      // Belize Hole
            
            // Blog post images
            'blog/post1.jpg' => '#8e44ad',         // Wisteria
            'blog/post2.jpg' => '#27ae60',         // Nephritis
            'blog/post3.jpg' => '#f1c40f',         // Sunflower
            'blog/post4.jpg' => '#e67e22'          // Carrot
        ];

        // Generate and save dummy images
        foreach ($colors as $filename => $color) {
            $this->generateDummyImage($filename, $color);
        }

        $this->command->info('Dummy images have been created successfully.');
    }

    /**
     * Generate a simple colored image with text
     */
    private function generateDummyImage($filename, $bgColor)
    {
        // Create a 400x300 image
        $image = imagecreatetruecolor(400, 300);
        
        // Background color
        $rgb = $this->hex2rgb($bgColor);
        $backgroundColor = imagecolorallocate($image, $rgb[0], $rgb[1], $rgb[2]);
        
        // Text color (white)
        $textColor = imagecolorallocate($image, 255, 255, 255);
        
        // Fill the background
        imagefilledrectangle($image, 0, 0, 399, 299, $backgroundColor);
        
        // Add text
        $text = pathinfo($filename, PATHINFO_FILENAME);
        $text = str_replace('-', ' ', $text);
        $text = ucwords($text);
        
        // Center the text
        $fontSize = 4;
        $textWidth = imagefontwidth($fontSize) * strlen($text);
        $textHeight = imagefontheight($fontSize);
        $centerX = (400 - $textWidth) / 2;
        $centerY = (300 - $textHeight) / 2;
        
        // Add text to image
        imagestring($image, $fontSize, $centerX, $centerY, $text, $textColor);
        
        // Add UNISHARE text at the bottom
        $brandText = "UNISHARE";
        $brandTextWidth = imagefontwidth($fontSize) * strlen($brandText);
        $brandX = (400 - $brandTextWidth) / 2;
        imagestring($image, $fontSize, $brandX, 250, $brandText, $textColor);
        
        // Save the image
        $path = storage_path('app/public/' . $filename);
        imagejpeg($image, $path, 90);
        
        // Free memory
        imagedestroy($image);
    }

    /**
     * Convert a hex color code to RGB
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
}
