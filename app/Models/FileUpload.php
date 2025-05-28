<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class FileUpload extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'original_filename',
        'stored_filename',
        'file_path',
        'file_type',
        'file_size',
        'file_hash',
        'google_drive_id',
        'minio_key',
        'external_url',
        'storage_type',
        'status',
        'upload_session_id',
        'chunks_total',
        'chunks_received',
        'error_message',
        'uploadable_id',
        'uploadable_type',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'file_size' => 'integer',
        'chunks_total' => 'integer',
        'chunks_received' => 'integer',
    ];

    /**
     * Get the user who uploaded the file.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the parent uploadable model.
     */
    public function uploadable()
    {
        return $this->morphTo();
    }

    /**
     * Check if the upload is complete.
     */
    public function isComplete()
    {
        return $this->status === 'completed';
    }

    /**
     * Check if the upload is in progress.
     */
    public function isInProgress()
    {
        return $this->status === 'pending' || $this->status === 'processing';
    }

    /**
     * Check if the upload has failed.
     */
    public function hasFailed()
    {
        return $this->status === 'failed';
    }

    /**
     * Check if all chunks have been received.
     */
    public function allChunksReceived()
    {
        return $this->chunks_total === $this->chunks_received;
    }

    /**
     * Get the public URL of the file
     *
     * @return string|null
     */
    public function getPublicUrl()
    {
        if ($this->storage_type === 'local') {
            // Check if the file is in a public directory
            if (strpos($this->file_path, 'public/') === 0) {
                // Return the URL using the Storage facade
                return Storage::url(str_replace('public/', '', $this->file_path));
            } else {
                // For files in private directory, normalize the path for the API endpoint
                $path = $this->file_path;
                
                // Remove 'private/' prefix if present for API URL
                if (strpos($path, 'private/') === 0) {
                    $path = substr($path, 8);
                }
                
                // Return a URL that will be handled by our StorageController
                return url('/api/storage/file/' . $path);
            }
        } elseif ($this->storage_type === 'google_drive' && $this->google_drive_id) {
            // Return Google Drive URL
            return "https://drive.google.com/file/d/{$this->google_drive_id}/view";
        } elseif ($this->storage_type === 'minio' && $this->minio_key) {
            // Return MinIO URL if available
            return $this->external_url;
        }
        
        return null;
    }
}
