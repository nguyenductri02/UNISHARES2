<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'avatar',
        'bio',
        'university',
        'department',
        'student_id',
        'is_active',
        'ban_reason',
        'banned_at',
        'last_login_at',
        'last_activity_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean',
        'banned_at' => 'datetime',
        'last_login_at' => 'datetime',
        'last_activity_at' => 'datetime',
    ];

    /**
     * Get the documents for the user.
     */
    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    /**
     * Get the posts for the user.
     */
    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    /**
     * Get the comments for the user.
     */
    public function comments()
    {
        return $this->hasMany(DocumentComment::class);
    }

    /**
     * Get the post comments for the user.
     */
    public function postComments()
    {
        return $this->hasMany(PostComment::class);
    }

    /**
     * Get the ratings for the user.
     */
    public function ratings()
    {
        return $this->hasMany(DocumentRating::class);
    }

    /**
     * Get the groups that the user is a member of.
     */
    public function groups()
    {
        return $this->belongsToMany(Group::class, 'group_members')
            ->withPivot('role', 'status')
            ->withTimestamps();
    }

    /**
     * Get the chats that the user is a participant of.
     */
    public function chats()
    {
        return $this->belongsToMany(Chat::class, 'chat_participants')
            ->withPivot('is_admin', 'last_read_at')
            ->withTimestamps();
    }

    /**
     * Get the messages sent by the user.
     */
    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    /**
     * Get the likes for the user.
     */
    public function likes()
    {
        return $this->hasMany(Like::class);
    }

    /**
     * Get the reports created by the user.
     */
    public function reports()
    {
        return $this->hasMany(Report::class, 'reporter_id');
    }

    /**
     * Get the AI chats for the user.
     */
    public function aiChats()
    {
        return $this->hasMany(AIChat::class);
    }

    /**
     * Get user authentication logs.
     */
    public function authentications()
    {
        return $this->hasMany(UserAuthentication::class);
    }

    /**
     * Get the role of the user as a string (compatibility function)
     *
     * @return string
     */
    public function getRoleAttribute()
    {
        if ($this->roles()->count() > 0) {
            return $this->roles()->first()->name;
        }
        return 'student'; // Default role
    }

    /**
     * Check if user is admin.
     */
    public function isAdmin()
    {
        return $this->hasRole('admin');
    }

    /**
     * Check if user is moderator.
     */
    public function isModerator()
    {
        return $this->hasRole('moderator');
    }

    /**
     * Check if user is lecturer.
     */
    public function isLecturer()
    {
        return $this->hasRole('lecturer');
    }

    /**
     * Check if user is student.
     */
    public function isStudent()
    {
        return $this->hasRole('student');
    }
}
