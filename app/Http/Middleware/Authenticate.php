<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo(Request $request): ?string
    {
        // IMPORTANT: Never try to use the route() helper here as it may cause 
        // "Route [login] not defined" errors when the login route doesn't exist
        // Always return null for API requests, we'll handle the response in unauthenticated()
        if ($request->is('api/*') || $request->expectsJson() || $request->header('Accept') == 'application/json') {
            return null;
        }
        
        // For web routes, redirect to home page instead of trying to use a named route
        return '/';
    }
    
    /**
     * Handle unauthenticated users
     */
    protected function unauthenticated($request, array $guards)
    {
        // For API routes, JSON requests, or requests with Accept: application/json header
        if ($request->is('api/*') || $request->expectsJson() || $request->header('Accept') == 'application/json') {
            return response()->json([
                'message' => 'Unauthenticated. Please log in to access this resource.',
                'success' => false,
                'error' => 'unauthenticated',
                'status_code' => 401
            ], 401);
        }

        // For storage file requests that failed authentication, send a plain 401
        if ($request->is('api/storage/*')) {
            return response('Unauthorized', 401);
        }
        
        // For web routes, use the default behavior which uses our redirectTo method
        return parent::unauthenticated($request, $guards);
    }
}
