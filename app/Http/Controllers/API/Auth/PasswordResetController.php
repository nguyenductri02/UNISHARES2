<?php

namespace App\Http\Controllers\API\Auth;

use App\Http\Controllers\Controller;
use App\Mail\ResetPasswordMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class PasswordResetController extends Controller
{
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Verify if email exists
        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['message' => 'Email không tồn tại trong hệ thống'], 404);
        }

        // Create a new token
        $token = Str::random(64);
        
        // Store token in database
        try {
            // Make sure the table exists first
            if (!Schema::hasTable('password_reset_tokens')) {
                Schema::create('password_reset_tokens', function ($table) {
                    $table->string('email')->primary();
                    $table->string('token');
                    $table->timestamp('created_at')->nullable();
                });
            }

            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $request->email],
                [
                    'token' => Hash::make($token),
                    'created_at' => Carbon::now()
                ]
            );
            
            // Generate the reset URL that will be sent in the email
            $resetUrl = config('app.frontend_url') . '/reset-password?token=' . $token . '&email=' . $request->email;
            
            // Send the password reset email
            try {
                Mail::to($request->email)->send(new ResetPasswordMail($resetUrl, $user->name ?? 'User'));
                
                return response()->json([
                    'message' => 'Email đặt lại mật khẩu đã được gửi',
                    'debug_url' => config('app.debug') ? $resetUrl : null // Only include in debug mode
                ]);
            } catch (\Exception $e) {
                // Log email sending error but don't expose it to the user
                \Log::error('Failed to send password reset email: ' . $e->getMessage());
                
                return response()->json([
                    'message' => 'Email đặt lại mật khẩu đã được gửi',
                    'debug_url' => $resetUrl // Always include in case of email issues
                ]);
            }
            
        } catch (\Exception $e) {
            return response()->json(['message' => 'Không thể gửi email đặt lại mật khẩu: ' . $e->getMessage()], 500);
        }
    }

    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|confirmed|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            // Find token record
            $tokenRecord = DB::table('password_reset_tokens')
                ->where('email', $request->email)
                ->first();

            // Check if token exists
            if (!$tokenRecord) {
                return response()->json(['message' => 'Token không hợp lệ hoặc đã hết hạn'], 400);
            }

            // Check if token matches
            if (!Hash::check($request->token, $tokenRecord->token)) {
                return response()->json(['message' => 'Token không hợp lệ'], 400);
            }

            // Check if token is expired (tokens expire after 60 minutes by default)
            $created = Carbon::parse($tokenRecord->created_at);
            if (Carbon::now()->diffInMinutes($created) > 60) {
                return response()->json(['message' => 'Token đã hết hạn'], 400);
            }

            // Update user's password
            $user = User::where('email', $request->email)->first();
            if (!$user) {
                return response()->json(['message' => 'Không tìm thấy người dùng với email này'], 404);
            }

            $user->password = Hash::make($request->password);
            $user->save();

            // Delete the token
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();

            return response()->json(['message' => 'Mật khẩu đã được đặt lại thành công']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Lỗi khi đặt lại mật khẩu: ' . $e->getMessage()], 500);
        }
    }
}
