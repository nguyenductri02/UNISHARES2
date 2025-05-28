<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string|array  ...$roles
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        Log::info('CheckRole middleware called', [
            'roles' => $roles,
            'uri' => $request->path(),
            'authenticated' => auth()->check()
        ]);

        if (!auth()->check()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated.',
                ], 401);
            }
            
            return redirect()->route('login');
        }
        
        $user = auth()->user();
        
        // Log the user details for debugging
        Log::debug('CheckRole middleware - User details', [
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'roles' => isset($user->roles) ? $user->roles->pluck('name')->toArray() : [],
            'role_property' => $user->role ?? 'not set',
            'requested_roles' => $roles,
            'has_role_method' => method_exists($user, 'hasRole')
        ]);
        
        // Special case: Admin superpower - always allow access
        if (strtolower($user->role ?? '') === 'admin' || 
            (isset($user->roles) && $user->roles->pluck('name')->contains('admin'))) {
            Log::info('Admin access granted automatically', ['user_id' => $user->id]);
            return $next($request);
        }

        // Method 1: Check using Spatie's hasRole method
        if (method_exists($user, 'hasRole')) {
            foreach ($roles as $role) {
                // Check role case-insensitively
                if ($user->hasRole($role)) {
                    Log::info("Access granted via Spatie hasRole: {$role}", ['user_id' => $user->id]);
                    return $next($request);
                }
            }
        }
        
        // Method 2: Check roles relationship directly (from Spatie)
        if (isset($user->roles) && $user->roles->count() > 0) {
            $userRoles = $user->roles->pluck('name')->toArray();
            foreach ($roles as $role) {
                if (in_array(strtolower($role), array_map('strtolower', $userRoles))) {
                    Log::info("Access granted via roles relationship check: {$role}", ['user_id' => $user->id]);
                    return $next($request);
                }
            }
        }
        
        // Method 3: Fallback to simple role column in user model
        if (isset($user->role)) {
            $userRole = $user->role;
            
            foreach ($roles as $role) {
                if (strtolower($userRole) === strtolower($role)) {
                    Log::info("Access granted via role property: {$role}", ['user_id' => $user->id]);
                    return $next($request);
                }
            }
        }
        
        // Access denied
        if ($request->expectsJson()) {
            Log::warning('CheckRole middleware - Access denied', [
                'user_id' => $user->id,
                'roles' => isset($user->roles) ? $user->roles->pluck('name')->toArray() : [],
                'role_property' => $user->role ?? 'not set',
                'requested_roles' => $roles
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Không có quyền truy cập tài nguyên này.',
                'exception' => 'UnauthorizedException',
                'debug_info' => [
                    'user_roles' => isset($user->roles) ? $user->roles->pluck('name')->toArray() : [],
                    'requested_roles' => $roles,
                ]
            ], 403);
        }
        
        return redirect()->route('home')->with('error', 'Bạn không có quyền truy cập trang này.');
    }
}
