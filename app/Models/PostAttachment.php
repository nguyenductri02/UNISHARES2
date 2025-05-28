<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PostAttachment extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'post_id',
        'file_upload_id',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
        'file_hash',
        'thumbnail_path',
        'google_drive_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'file_size' => 'integer',
    ];

    /**
     * Get the post that the attachment belongs to.
     */
    public function post()
    {
        return $this->belongsTo(Post::class);
    }

    /**
     * Get the file upload record for this attachment.
     */
    public function fileUpload()
    {
        return $this->belongsTo(FileUpload::class, 'file_upload_id');
    }
    
    /**
     * Get the public URL of the file
     *
     * @return string|null
     */
    public function getFileUrlAttribute()
    {
        if ($this->fileUpload) {
            return $this->fileUpload->getPublicUrl();
        }
        
        // Fallback to direct file path
        if ($this->file_path) {
            if (strpos($this->file_path, 'public/') === 0) {
                return url('storage/' . str_replace('public/', '', $this->file_path));
            }
            
            // Remove 'private/' prefix if it exists
            $path = $this->file_path;
            if (strpos($path, 'private/') === 0) {
                $path = substr($path, 8);
            }
            
            return url('/api/storage/file/' . $path);
        }
        
        return null;
    }
}
