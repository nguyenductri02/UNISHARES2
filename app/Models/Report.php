<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Report extends Model
{
    use HasFactory;

    protected $fillable = [
        'reported_by',
        'reported_user',
        'document_id',
        'comment_id',
        'message_id',
        'reason',
        'status_reports',
    ];
    public function reportedBy()
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    public function reportedUser()
    {
        return $this->belongsTo(User::class, 'reported_user');
    }

    public function document()
    {
        return $this->belongsTo(Document::class, 'document_id');
    }

    public function comment()
    {
        return $this->belongsTo(Comment::class, 'comment_id');
    }

    public function message()
    {
        return $this->belongsTo(Message::class, 'message_id');
    }
}
