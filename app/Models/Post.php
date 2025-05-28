<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Post extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'content',
        'title',
        'user_id',
        'group_id',
        'is_pinned',
        'is_announcement',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_pinned' => 'boolean',
        'is_announcement' => 'boolean',
    ];

    /**
     * Get the user who created the post.
     */
    public function author()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the group that owns the post.
     */
    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    /**
     * Get the comments for the post.
     */
    public function comments()
    {
        return $this->hasMany(PostComment::class);
    }

    /**
     * Get the attachments for the post.
     */
    public function attachments()
    {
        return $this->hasMany(PostAttachment::class);
    }

    /**
     * Get the likes for the post.
     */
    public function likes()
    {
        return $this->morphMany(Like::class, 'likeable');
    }

    /**
     * Increment the like count.
     */
    public function incrementLikeCount()
    {
        $this->increment('like_count');
    }

    /**
     * Decrement the like count.
     */
    public function decrementLikeCount()
    {
        $this->decrement('like_count');
    }
}
