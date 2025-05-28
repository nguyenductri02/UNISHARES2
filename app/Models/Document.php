<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Document extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'group_id',
        'title',
        'description',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
        'file_hash',
        'thumbnail_path',
        'google_drive_id',
        'is_official',
        'is_approved',
        'subject',
        'course_code',
        'download_count',
        'view_count',
        'type',    
        'status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_official' => 'boolean',
        'is_approved' => 'boolean',
        'file_size' => 'integer',
        'download_count' => 'integer',
        'view_count' => 'integer',
    ];

    /**
     * Get the user who uploaded the document.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the group that owns the document (if any).
     */
    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    /**
     * Get the comments for the document.
     */
    public function comments()
    {
        return $this->hasMany(DocumentComment::class);
    }

    /**
     * Get the ratings for the document.
     */
    public function ratings()
    {
        return $this->hasMany(DocumentRating::class);
    }

    /**
     * Get the average rating for the document.
     */
    public function getAverageRatingAttribute()
    {
        return $this->ratings()->avg('rating') ?? 0;
    }

    /**
     * Get the file upload record for this document.
     */
    public function fileUpload()
    {
        return $this->morphOne(FileUpload::class, 'uploadable');
    }

    /**
     * Get the reports for this document.
     */
    public function reports()
    {
        return $this->morphMany(Report::class, 'reportable');
    }

    /**
     * Increment the download count.
     */
    public function incrementDownloadCount()
    {
        $this->increment('download_count');
    }

    /**
     * Increment the view count.
     */
    public function incrementViewCount()
    {
        $this->increment('view_count');
    }

    /**
     * Get the thumbnail URL for the document.
     *
     * @return string|null
     */
    public function getThumbnailUrlAttribute()
    {
        if (!$this->thumbnail_path) {
            // Return appropriate default image based on file type
            return $this->getDefaultThumbnail();
        }
        
        return url('storage/' . $this->thumbnail_path);
    }
    
    /**
     * Get a default thumbnail based on document type
     * 
     * @return string
     */
    protected function getDefaultThumbnail()
    {
        $extension = pathinfo($this->file_name, PATHINFO_EXTENSION);
        
        switch (strtolower($extension)) {
            case 'doc':
            case 'docx':
                return url('storage/documents/doc.png');
            case 'pdf':
                return url('storage/documents/pdf.png');
            case 'ppt':
            case 'pptx':
                return url('storage/documents/ppt.png');
            case 'txt':
                return url('storage/documents/txt.png');
            case 'xls':
            case 'xlsx':
                return url('storage/documents/xls.png');
            case 'zip':
            case 'rar':
                return url('storage/documents/zip.png');
            default:
                return url('storage/documents/doc.png');
        }
    }

    /**
     * Get the download URL for the document
     *
     * @param bool $includeToken Whether to include an authentication token in the URL
     * @return string
     */
    public function getDownloadUrlAttribute($includeToken = false)
    {
        // Remove 'private/' prefix if present for API URL
        $path = $this->file_path;
        if (strpos($path, 'private/') === 0) {
            $path = substr($path, 8);
        }
        
        $url = url('/api/storage/download/' . $path);
        
        // Add authentication token if requested and user is logged in
        if ($includeToken && auth()->check()) {
            $token = auth()->user()->createToken('file-access')->plainTextToken;
            $url .= '?token=' . $token;
        }
        
        return $url;
    }
    
    /**
     * Get a download URL with authentication token
     *
     * @return string
     */
    public function getTokenizedDownloadUrl()
    {
        return $this->getDownloadUrlAttribute(true);
    }
    
    /**
     * Get the view URL for the document
     *
     * @param bool $includeToken Whether to include an authentication token in the URL
     * @return string|null
     */
    public function getViewUrlAttribute($includeToken = false)
    {
        // Check if file_path exists
        if (!$this->file_path) {
            return null;
        }
        
        // Remove 'private/' prefix if present for API URL
        $path = $this->file_path;
        if (strpos($path, 'private/') === 0) {
            $path = substr($path, 8);
        }
        
        $url = url('/api/storage/file/' . $path);
        
        // Add authentication token if requested and user is logged in
        if ($includeToken && auth()->check()) {
            $token = auth()->user()->createToken('file-access')->plainTextToken;
            $url .= '?token=' . $token;
        }
        
        return $url;
    }
    
    /**
     * Get a view URL with authentication token
     *
     * @return string
     */
    public function getTokenizedViewUrl()
    {
        return $this->getViewUrlAttribute(true);
    }

    /**
     * Scope a query to only include approved documents.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeApproved($query)
    {
        return $query->where(function($query) {
            $query->where('is_approved', true)
                  ->orWhere('status', 'approved');
        });
    }

    /**
     * Scope a query to only include course-type documents.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeCourses($query)
    {
        return $query->where('type', 'course');
    }
}
