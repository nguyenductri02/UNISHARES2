<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        // Exclude API routes from CSRF protection if using token-based auth
        'api/*',
        'sanctum/csrf-cookie',
        // Explicitly exclude auth endpoints
        'api/auth/login',
        'api/auth/register',
        'api/auth/logout'
    ];
}
