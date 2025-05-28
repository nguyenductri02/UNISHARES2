<?php

namespace App\Http\Controllers\API\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'required',
            'password' => ['required', 'confirmed', Password::defaults()],
            'university' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'student_id' => 'nullable|string|max:50',
            'bio' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'university' => $request->university,
            'department' => $request->department,
            'student_id' => $request->student_id,
            'bio' => $request->bio,
        ]);

        // Gán vai trò mặc định là sinh viên
        $user->assignRole('student');

        // Tạo token xác thực
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * Handle user login
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        Log::info('Login attempt', [
            'email' => $request->email,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent()
        ]);

        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'password' => 'required|string|min:6',
            ]);

            if ($validator->fails()) {
                Log::warning('Login validation failed', [
                    'email' => $request->email,
                    'errors' => $validator->errors()->toArray()
                ]);
                return response()->json([
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Try to find the user by email first for debugging
            $user = User::where('email', $request->email)->first();
            if (!$user) {
                Log::warning('Login failed - user not found', [
                    'email' => $request->email
                ]);
                return response()->json([
                    'message' => 'Invalid login credentials'
                ], 401);
            }

            // Check if user account is marked inactive
            if ($user->is_active === false) {
                Log::warning('Login attempt for inactive account', [
                    'user_id' => $user->id,
                    'email' => $user->email
                ]);
                
                // Re-activate the account if it was inactive
                $user->update(['is_active' => true]);
                Log::info('Reactivated inactive account', [
                    'user_id' => $user->id,
                    'email' => $user->email
                ]);
            }

            // Check password manually for debugging
            if (!Hash::check($request->password, $user->password)) {
                Log::warning('Login failed - password mismatch', [
                    'email' => $request->email
                ]);
                return response()->json([
                    'message' => 'Invalid login credentials'
                ], 401);
            }

            // If manual check passed but auth attempt fails, we should log that
            if (!Auth::attempt(['email' => $request->email, 'password' => $request->password])) {
                Log::warning('Login failed - Auth::attempt failed despite matching credentials', [
                    'email' => $request->email
                ]);
                return response()->json([
                    'message' => 'Authentication system error, please try again'
                ], 500);
            }

            $user = $request->user();
            
            // Update last login timestamp
            $user->update([
                'last_login_at' => now(),
                'last_activity_at' => now(),
                'is_active' => true
            ]);

            // Delete any expired tokens for this user
            $user->tokens()->where('expires_at', '<', now())->delete();

            // Load roles with the user
            $user->load('roles');

            // Generate the token with abilities based on roles
            $abilities = ['*']; // Default all abilities
            
            // Create token with extended expiration time
            $token = $user->createToken('auth_token', $abilities, now()->addDays(30))->plainTextToken;

            Log::info('Login successful', [
                'user_id' => $user->id,
                'email' => $user->email
            ]);

            return response()->json([
                'user' => $user,
                'token' => $token,
                'token_type' => 'Bearer'
            ]);
        } catch (\Exception $e) {
            Log::error('Login exception', [
                'email' => $request->email,
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'An error occurred during login',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        // Get the user before logging out
        $user = $request->user();
        
        // Log the logout attempt
        Log::info('User logout', [
            'user_id' => $user ? $user->id : null,
            'email' => $user ? $user->email : null
        ]);
        
        // Only revoke the current token rather than all tokens for the user
        if ($user) {
            // Delete only the current token
            if ($request->bearerToken()) {
                $user->tokens()->where('token', hash('sha256', $request->bearerToken()))->delete();
            } else {
                // If using web session without token, only delete the current session
                if (session()->getId()) {
                    \DB::table('sessions')->where('id', session()->getId())->delete();
                }
            }
            
            // If using user_authentications table, update logout time
            if (Schema::hasTable('user_authentications')) {
                // Update authentication records that don't have logout_at yet
                \DB::table('user_authentications')
                    ->where('user_id', $user->id)
                    ->whereNull('logout_at')
                    ->update(['logout_at' => now()]);
            }
            
            // Log sessions cleanup for debugging
            Log::info('Session logout for user', [
                'user_id' => $user->id,
                'session_id' => session()->getId(),
                'token' => $request->bearerToken() ? 'Present (specific token revoked)' : 'None',
                'current_session_deleted' => true
            ]);
        }
        
        // Clear the session data if using session
        if (session()->has('auth_user')) {
            session()->forget('auth_user');
        }
        session()->flush();
        
        // Invalidate and regenerate the session ID
        session()->invalidate();
        session()->regenerate();

        return response()->json([
            'message' => 'Đăng xuất thành công',
        ]);
    }

    /**
     * Get authenticated user data
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function user(Request $request)
    {
        try {
            $user = $request->user();
            
            // If user exists, update last_activity_at to keep track of active users
            if ($user) {
                Log::info('User data requested', [
                    'user_id' => $user->id,
                    'email' => $user->email
                ]);
                
                $user->update([
                    'last_activity_at' => now()
                ]);
                
                // Load relationships
                $user->load('roles');
                
                // Get latest activity data
                $activityData = [
                    'recent_logins' => $user->authentications()
                        ->latest()
                        ->take(5)
                        ->get()
                        ->map(function ($auth) {
                            return [
                                'ip' => $auth->ip_address,
                                'device' => $auth->user_agent,
                                'time' => $auth->created_at
                            ];
                        })
                ];
                
                return response()->json([
                    'success' => true,
                    'user' => $user,
                    'activity' => $activityData
                ]);
            }
            
            return response()->json(['message' => 'Unauthenticated'], 401);
        } catch (\Exception $e) {
            Log::error('Error in user endpoint', [
                'user_id' => $request->user() ? $request->user()->id : null,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'message' => 'Error retrieving user data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function refreshToken(Request $request)
    {
        // Xóa token hiện tại
        $request->user()->currentAccessToken()->delete();

        // Tạo token mới
        $token = $request->user()->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * Update user profile information
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();
        
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:20',
            'university' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'student_id' => 'nullable|string|max:50',
            'bio' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Update only the fields that were sent in the request
        $user->fill($request->only([
            'name', 'phone', 'university', 'department', 'student_id', 'bio'
        ]));
        
        $user->save();

        return response()->json([
            'user' => $user->fresh()->load('roles'),
            'message' => 'Thông tin hồ sơ đã được cập nhật thành công'
        ]);
    }
    
    /**
     * Update user password
     */
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();

        // Verify current password
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Mật khẩu hiện tại không chính xác'
            ], 422);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json([
            'message' => 'Mật khẩu đã được cập nhật thành công'
        ]);
    }
    
    /**
     * Upload user avatar
     */
    public function uploadAvatar(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        
        // Handle file upload
        if ($request->hasFile('avatar')) {
            // Store the new avatar
            $path = $request->file('avatar')->store('avatars', 'public');
            
            $user->avatar = asset('storage/' . $path);
            $user->save();
        }

        return response()->json([
            'user' => $user->fresh(),
            'message' => 'Ảnh đại diện đã được cập nhật thành công'
        ]);
    }
}
