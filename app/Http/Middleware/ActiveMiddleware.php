<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

class ActiveMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            // Handle 'active' parameter for user filtering
            if ($request->has('active')) {
                // Convert to boolean value
                $isActive = filter_var($request->active, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                
                // Set the is_active parameter instead
                $request->merge(['is_active' => $isActive]);
                
                // Remove the original 'active' parameter to avoid confusion
                $request->request->remove('active');
            }
            
            return $next($request);
        } catch (\Exception $e) {
            // Log any middleware errors
            Log::error('ActiveMiddleware error: ' . $e->getMessage(), [
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Continue the request even if there's an error in the middleware
            return $next($request);
        }
    }
}
