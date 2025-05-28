<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class SessionTokenConsistencyMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only process for authenticated users
        if (Auth::check()) {
            $user = $request->user();
            
            // Check if there's a sanctum token but session doesn't have user_id
            if ($user && session()->getId() && !session()->has('user_id')) {
                // Ensure the session is tied to the user
                session()->put('user_id', $user->id);
                
                // Log the correction
                Log::debug('Fixed session without user_id', [
                    'user_id' => $user->id,
                    'session_id' => session()->getId()
                ]);
            }
            
            // Check if user has tokens
            $hasValidToken = $user->tokens()->exists() || $request->is('api/broadcasting/auth');
            
            // If no valid token but authenticated session exists, clean up the session
            // Skip this check for broadcasting auth requests which might use session auth
            if (!$hasValidToken && !$request->is('api/auth/login', 'api/auth/logout', 'api/broadcasting/auth')) {
                Log::warning('User has session but no valid token - logging out', [
                    'user_id' => $user->id,
                    'session_id' => session()->getId()
                ]);
                
                // Force logout
                Auth::logout();
                session()->invalidate();
                session()->regenerate();
                
                // Return an unauthorized response for API requests
                if ($request->expectsJson() || $request->is('api/*')) {
                    return response()->json([
                        'message' => 'Session expired. Please login again.',
                        'code' => 'session_expired'
                    ], 401);
                }
                
                // For web requests, redirect to login
                return redirect('/login');
            }
        }
        
        return $next($request);
    }
}
