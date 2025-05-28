<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AIChatMessage extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'ai_chat_messages';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'ai_chat_id',
        'role',
        'content',
    ];

    /**
     * Get the chat that the message belongs to.
     */
    public function chat()
    {
        return $this->belongsTo(AIChat::class, 'ai_chat_id', 'id');
    }
}
