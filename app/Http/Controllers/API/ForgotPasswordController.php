<?php

namespace App\Http\Controllers\API;

use App\Mail\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use App\Models\ResetCodePassword;
use App\Mail\SendCodeResetPassword;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Facades\Hash;
use App\Models\User;


class ForgotPasswordController extends Controller
{
    public function sendResetCode(Request $request)
    {        
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email'
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Email không tồn tại trong hệ thống!'], 400);
        }
        
        $code = rand(100000, 999999);
        
        User::where([
            'email' => $request->email
        ])
        ->update([
            'code'      => $code,
            'time_code' => Carbon::now()
        ]);

        return response()->json(['message' => 'Mã xác nhận đã được gửi về email!']);
    }
   
    public function resetPassword(Request $request)
    {       
        $request->validate([
            'email' => 'required|email',
            'code' => 'required',
            'new_password' => 'required'
        ]);
    
        $user = User::where('email', $request->email)->first();
    
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Email không tồn tại!'], 404);
        }
    
        // Kiểm tra mã code có đúng và chưa hết hạn
        if ($user->reset_code !== $request->code || now()->gt($user->reset_code_expires_at)) {
            return response()->json(['status' => 'error', 'message' => 'Mã xác nhận không hợp lệ hoặc đã hết hạn!'], 400);
        }
    
        // Cập nhật mật khẩu mới
        $user->update([
            'password' => Hash::make($request->new_password),
            'reset_code' => null, // Xóa mã code sau khi dùng
            'reset_code_expires_at' => null
        ]);
    
        return response()->json(['status' => 'success', 'message' => 'Mật khẩu đã được cập nhật thành công!'], 200);
    }
}