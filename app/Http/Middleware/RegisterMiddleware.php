<?php

namespace App\Http\Middleware;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;

/**
 * Class to directly register middleware in routes
 */
class RegisterMiddleware
{
    /**
     * Register all middleware aliases directly in routes
     */    public static function registerAll()
    {
        try {
            // Register middleware using Route facade directly
            // In newer Laravel versions, we don't check if middleware exists first            Route::aliasMiddleware('role', CheckRole::class);
            Route::aliasMiddleware('permission', \Spatie\Permission\Middleware\PermissionMiddleware::class);
            Route::aliasMiddleware('role_or_permission', \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class);
            
            // Log that this was called
            Log::info('RegisterMiddleware::registerAll called - middleware registered');
        } catch (\Exception $e) {
            // Log error but don't let it crash the application
            Log::error('Error registering middleware: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
}
