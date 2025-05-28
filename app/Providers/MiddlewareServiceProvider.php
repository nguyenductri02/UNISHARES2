<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Http\Middleware\CheckRole;
use Illuminate\Routing\Router;
use Illuminate\Support\Facades\Log;

class MiddlewareServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // No services to register
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        try {
            /** @var Router $router */
            $router = $this->app->make(Router::class);
            
            // Explicitly register the CheckRole middleware
            $router->aliasMiddleware('role', CheckRole::class);
            
            // Log for debugging
            if ($this->app->environment('local')) {
                Log::info('MiddlewareServiceProvider booted - role middleware registered');
            }
        } catch (\Exception $e) {
            // Log error but don't crash application
            Log::error('Error in MiddlewareServiceProvider: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
}
