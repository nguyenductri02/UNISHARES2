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
    protected $fillable = [/*'user_name'*/'full_name', 'email', 'password', 'phone', 'address', 
        'dob','role', 'full_name', 'university', 'major', 
        'profile_picture_url', 'is_verified', 'contribution_points', 'avatar']; 
    // Ẩn khi trả về JSON (bảo mật)
    protected $hidden = [
        'password',
        'remember_token',
        'code',
    ];

    // Cấu hình casting dữ liệu
    protected $casts = [
        'email_verified_at' => 'datetime',
        'dob' => 'date',
        'time_code' => 'datetime',
        'is_verified' => 'boolean',
    ];

    // Mutator: Tự động chuẩn hóa tên
    public function setFullNameAttribute($value)
    {
        $this->attributes['full_name'] = ucwords(strtolower(trim($value)));
    }
    public function setAddressAttribute($value)
{
    $value = trim($value);
    $value = preg_replace('/\s+/', ' ', $value);
    $value = strtolower($value);
    $this->attributes['address'] = ucwords($value);
}
}
