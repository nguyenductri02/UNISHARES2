<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

class MessageAttachment extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'message_id',
        'file_name',
        'file_path',
        'file_size',
        'file_type',
    ];

    /**
     * Get the message that owns the attachment.
     */
    public function message()
    {
        return $this->belongsTo(Message::class);
    }
    
    /**
     * Get the download URL for the attachment
     * 
     * @return string
     */
    public function getDownloadUrl()
    {
        return URL::route('message.attachment.download', $this->id);
    }
    
    /**
     * Check if the file is an image
     * 
     * @return bool
     */
    public function isImage()
    {
        $imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
        return in_array($this->file_type, $imageTypes);
    }
    
    /**
     * Check if the file is a document
     * 
     * @return bool
     */
    public function isDocument()
    {
        $documentTypes = [
            'application/pdf', 
            'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain'
        ];
        return in_array($this->file_type, $documentTypes);
    }
    
    /**
     * Format file size for human readability
     * 
     * @return string
     */
    public function getFormattedFileSize()
    {
        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        
        $bytes /= pow(1024, $pow);
        
        return round($bytes, 2) . ' ' . $units[$pow];
    }
}
