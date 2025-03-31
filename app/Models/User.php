<?php
  
namespace App\Models;
  
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Model;
  
class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;
    protected $guarded = []; 
    protected $fillable = ['user_name', 'email', 'password', 'phone', 'address', 
        'role', 'full_name', 'university', 'major', 
        'profile_picture_url', 'is_verified', 'contribution_points', 'avatar']; 
}
