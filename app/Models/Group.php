<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Group extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
        'avatar',
        'cover_image',
        'creator_id',
        'course_code',
        'university',
        'department',
        'type',
        'requires_approval',
        'member_count',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'requires_approval' => 'boolean',
        'member_count' => 'integer',
        'type' => 'string',  // Explicitly cast type to string
    ];

    /**
     * Get the creator of the group.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    /**
     * Alias for creator method to make it compatible with reportable interface.
     * This ensures that the 'user' relationship works across all reportable types.
     */
    public function user()
    {
        return $this->creator();
    }

    /**
     * Get the members of the group.
     */
    public function members()
    {
        return $this->belongsToMany(User::class, 'group_members')
            ->withPivot('role', 'status')
            ->withTimestamps();
    }

    /**
     * Get the posts in the group.
     */
    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    /**
     * Get the chat for the group.
     */
    public function chat()
    {
        return $this->hasOne(Chat::class);
    }

    /**
     * Check if a user is a member of the group.
     */
    public function isMember(User $user)
    {
        return $this->members()
            ->where('user_id', $user->id)
            ->where('status', 'approved')
            ->exists();
    }

    /**
     * Check if a user is an admin of the group.
     */
    public function isAdmin(User $user)
    {
        return $this->members()
            ->where('user_id', $user->id)
            ->where('role', 'admin')
            ->exists();
    }

    /**
     * Check if a user is a moderator of the group.
     */
    public function isModerator(User $user)
    {
        return $this->members()
            ->where('user_id', $user->id)
            ->whereIn('role', ['admin', 'moderator'])
            ->exists();
    }

    /**
     * Get the pending membership requests.
     */
    public function pendingRequests()
    {
        return $this->members()
            ->wherePivot('status', 'pending');
    }

    /**
     * Xóa thành viên khỏi nhóm một cách an toàn
     * Phương thức này ngăn chặn việc xóa cascade gây ảnh hưởng đến bản ghi User
     * 
     * @param int $userId ID của người dùng cần xóa khỏi nhóm
     * @return bool Kết quả của thao tác xóa
     */
    public function safeRemoveMember($userId)
    {
        // Detach thay vì delete để tránh các vấn đề với ràng buộc khóa ngoại
        $result = $this->members()->detach($userId);
        
        // Cập nhật số lượng thành viên nếu có sự thay đổi
        if ($result > 0) {
            $this->decrement('member_count');
        }
        
        return $result > 0;
    }

    /**
     * Get the "is_private" accessor - for backward compatibility
     *
     * @return bool
     */
    public function getIsPrivateAttribute()
    {
        return $this->requires_approval === true || $this->type === 'private';
    }

    /**
     * Set the "is_private" attribute - for backward compatibility
     *
     * @param bool $value
     * @return void
     */
    public function setIsPrivateAttribute($value)
    {
        $this->attributes['requires_approval'] = (bool)$value;
    }

    /**
     * Scope a query to only include private groups.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopePrivate($query)
    {
        return $query->where('requires_approval', true)
                    ->orWhere('type', 'private');
    }

    /**
     * Scope a query to only include public groups.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopePublic($query)
    {
        return $query->where(function($q) {
            $q->where('requires_approval', false)
               ->orWhereNull('requires_approval');
        })
        ->where(function($q) {
            $q->where('type', '!=', 'private')
               ->orWhereNull('type');
        });
    }
}
