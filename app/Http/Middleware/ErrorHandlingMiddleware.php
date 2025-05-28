<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

class ErrorHandlingMiddleware
{
    /**
     * Handle an incoming request.
     */    public function handle(Request $request, Closure $next): Response
    {
        try {
            // Log request information for debugging
            if (env('APP_DEBUG')) {
                Log::debug('API Request', [
                    'url' => $request->fullUrl(),
                    'method' => $request->method(),
                    'inputs' => $request->all(),
                    'headers' => $request->header(),
                    'user_id' => $request->user() ? $request->user()->id : 'guest'
                ]);
            }
            
            $response = $next($request);
            
            // Log response for debugging
            if (env('APP_DEBUG') && $response->getStatusCode() >= 400) {
                Log::debug('API Response', [
                    'status' => $response->getStatusCode(),
                    'content' => $response->getContent()
                ]);
            }
            
            return $response;
        } catch (\Exception $e) {
            Log::error('API Exception: ' . $e->getMessage(), [
                'exception' => $e,
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'inputs' => $request->all(),
                'headers' => $request->header(),
                'user_id' => $request->user() ? $request->user()->id : 'guest'
            ]);

            return response()->json([
                'success' => false, 
                'message' => 'Server error: ' . $e->getMessage(),
                'trace' => env('APP_DEBUG') ? $e->getTrace() : null
            ], 500);
        }
    }
}
