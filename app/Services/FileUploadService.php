<?php

namespace App\Services;

use App\Models\FileUpload;
use App\Models\Document;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileUploadService
{
    protected $googleDriveService;
    protected $minioService;
    protected $lockTimeout = 30; // Thời gian khóa tối đa (giây)
    protected $defaultStorage;

    /**
     * Tạo một instance mới của service.
     */
    public function __construct(GoogleDriveService $googleDriveService, MinIOService $minioService)
    {
        $this->googleDriveService = $googleDriveService;
        $this->minioService = $minioService;
        $this->defaultStorage = config('filesystems.default_storage', 'local');
    }

    /**
     * Upload a file to the appropriate storage location
     *
     * @param UploadedFile $file
     * @param int $userId
     * @param string $type
     * @param int|null $entityId
     * @return FileUpload
     */
    public function uploadFile(UploadedFile $file, int $userId, string $type, int $entityId = null)
    {
        // Generate a unique filename
        $extension = $file->getClientOriginalExtension();
        $uniqueId = (string) Str::uuid();
        $uniqueFilename = $uniqueId . '.' . $extension;
        
        // Determine the storage directory without 'private/' prefix
        // since Laravel's store method will handle this correctly
        $storageDir = 'uploads/' . $userId . '/' . $type;
        
        // Use the 'private' disk to store in private directory
        $path = $file->storeAs($storageDir, $uniqueFilename, 'private');
        
        // Create file hash
        $fileHash = md5_file($file->getRealPath());
        
        // Create a FileUpload record
        $fileUpload = new FileUpload();
        $fileUpload->user_id = $userId;
        $fileUpload->original_filename = $file->getClientOriginalName();
        $fileUpload->stored_filename = $uniqueFilename;
        $fileUpload->file_path = $path; // This will include 'private/' prefix automatically
        $fileUpload->file_type = $file->getMimeType();
        $fileUpload->file_size = $file->getSize();
        $fileUpload->file_hash = $fileHash;
        $fileUpload->storage_type = 'local';
        $fileUpload->status = 'completed';
        $fileUpload->uploadable_type = $type;
        $fileUpload->uploadable_id = $entityId;
        $fileUpload->save();
        
        return $fileUpload;
    }

    /**
     * Check if a file exists based on its hash
     *
     * @param UploadedFile $file File to check
     * @return array Information about the file existence
     */
    public function checkFileExists(UploadedFile $file)
    {
        $fileHash = hash_file('md5', $file->getPathname());
        
        $existingUpload = FileUpload::where('file_hash', $fileHash)
            ->where('status', 'completed')
            ->first();
            
        if (!$existingUpload) {
            return [
                'exists' => false
            ];
        }
        
        // Find the document associated with this file
        $document = Document::whereHas('fileUpload', function($query) use ($existingUpload) {
            $query->where('id', $existingUpload->id);
        })->first();
        
        return [
            'exists' => true,
            'file_upload_id' => $existingUpload->id,
            'document_id' => $document ? $document->id : null,
            'document' => $document
        ];
    }
    
    /**
     * Delete a file upload and associated file
     *
     * @param FileUpload $fileUpload The FileUpload record to delete
     * @return bool Success status
     */
    public function deleteFileUpload(FileUpload $fileUpload)
    {
        // Count how many other uploads reference the same file
        $referenceCount = FileUpload::where('file_hash', $fileUpload->file_hash)
            ->where('id', '!=', $fileUpload->id)
            ->count();
            
        // Only delete the physical file if no other uploads reference it
        if ($referenceCount === 0 && Storage::exists($fileUpload->file_path)) {
            Storage::delete($fileUpload->file_path);
        }
        
        // Delete the record
        return $fileUpload->delete();
    }
    
    /**
     * Handle chunked file uploads
     * 
     * @param UploadedFile $chunk The chunk file
     * @param string $uploadSessionId The upload session ID
     * @param int $chunkIndex The index of the current chunk
     * @param int $totalChunks The total number of chunks
     * @param int $userId The ID of the user uploading the file
     * @return FileUpload|null The FileUpload model if complete, null if still in progress
     */
    public function uploadFileChunk(
        UploadedFile $chunk, 
        string $uploadSessionId, 
        int $chunkIndex, 
        int $totalChunks, 
        int $userId
    ): ?FileUpload
    {
        // Get or create upload session
        $fileUpload = FileUpload::firstOrCreate(
            ['upload_session_id' => $uploadSessionId],
            [
                'user_id' => $userId,
                'original_filename' => request()->input('filename'),
                'file_type' => request()->input('filetype'),
                'file_size' => request()->input('filesize'),
                'chunks_total' => $totalChunks,
                'chunks_received' => 0,
                'status' => 'pending',
            ]
        );
        
        // Create temp directory for chunks
        $tempDir = storage_path("app/chunks/{$uploadSessionId}");
        if (!file_exists($tempDir)) {
            mkdir($tempDir, 0755, true);
        }
        
        // Save chunk
        $chunkPath = "{$tempDir}/chunk_{$chunkIndex}";
        file_put_contents($chunkPath, file_get_contents($chunk));
        
        // Update chunks received count
        $fileUpload->increment('chunks_received');
        
        // Check if all chunks are received
        if ($fileUpload->chunks_received >= $fileUpload->chunks_total) {
            // Combine chunks
            $finalFilePath = $this->combineChunks($fileUpload, $tempDir, $totalChunks);
            
            // Update FileUpload record
            $fileUpload->update([
                'file_path' => $finalFilePath,
                'status' => 'completed',
                'file_hash' => md5_file(storage_path("app/{$finalFilePath}")),
            ]);
            
            // Clean up temp directory
            $this->cleanupChunks($tempDir);
            
            return $fileUpload;
        }
        
        return null;
    }
    
    /**
     * Combine chunks into a single file
     * 
     * @param FileUpload $fileUpload The FileUpload record
     * @param string $tempDir The temporary directory with chunks
     * @param int $totalChunks The total number of chunks
     * @return string The path to the combined file
     */
    private function combineChunks(FileUpload $fileUpload, string $tempDir, int $totalChunks): string
    {
        // Generate the final path
        $extension = pathinfo($fileUpload->original_filename, PATHINFO_EXTENSION);
        $finalFilename = Str::uuid() . ".{$extension}";
        $finalDir = "uploads/{$fileUpload->user_id}";
        $finalPath = "{$finalDir}/{$finalFilename}";
        
        // Ensure directory exists in private disk
        if (!Storage::disk('private')->exists($finalDir)) {
            Storage::disk('private')->makeDirectory($finalDir);
        }
        
        // Create file handle for the final file - use private disk path
        $finalFilePath = storage_path("app/private/{$finalPath}");
        $finalFile = fopen($finalFilePath, 'wb');
        
        // Append each chunk
        for ($i = 0; $i < $totalChunks; $i++) {
            $chunkPath = "{$tempDir}/chunk_{$i}";
            $chunkContents = file_get_contents($chunkPath);
            fwrite($finalFile, $chunkContents);
        }
        
        // Close file handle
        fclose($finalFile);
        
        // Update stored filename
        $fileUpload->update([
            'stored_filename' => $finalFilename,
        ]);
        
        // Return path with 'private/' prefix
        return 'private/' . $finalPath;
    }
    
    /**
     * Clean up temporary chunk files
     * 
     * @param string $tempDir The temporary directory with chunks
     * @return void
     */
    private function cleanupChunks(string $tempDir): void
    {
        // Remove all files in the directory
        $files = glob("{$tempDir}/*");
        foreach ($files as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }
        
        // Remove the directory
        if (is_dir($tempDir)) {
            rmdir($tempDir);
        }
    }
    
    /**
     * Handle interrupted uploads
     * 
     * @param string $uploadId Upload session ID
     * @return array Status info
     */
    public function handleInterruptedUpload($uploadId)
    {
        $fileUpload = $this->getFileBySessionId($uploadId);
        
        if (!$fileUpload) {
            return null;
        }
        
        return [
            'upload_id' => $uploadId,
            'chunks_received' => $fileUpload->chunks_received,
            'chunks_total' => $fileUpload->chunks_total,
            'status' => $fileUpload->status
        ];
    }
    
    /**
     * Get file upload by session ID
     * 
     * @param string $uploadId Upload session ID
     * @return FileUpload|null
     */
    public function getFileBySessionId($uploadId)
    {
        return FileUpload::where('upload_session_id', $uploadId)->first();
    }
}
