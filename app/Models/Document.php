<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'files',
        'user_id',
        'subject',
        'university',
        'is_official',
        'status',
        'download_count',
        'rating',
        'rating_count',
    ];
}
