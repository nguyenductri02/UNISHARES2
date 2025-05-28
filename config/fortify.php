<?php

use App\Providers\RouteServiceProvider;
use Laravel\Fortify\Features;

return [
    'guard' => 'web',
    'middleware' => ['web'],
    'passwords' => 'users',
    'username' => 'email',
    'email' => 'email',
    'views' => false,
    'home' => RouteServiceProvider::HOME,
    'prefix' => '',
    'domain' => null,
    'limiters' => [
        'login' => 'login',
        'two-factor' => 'two-factor',
    ],
    'redirects' => [
        'login' => null,
        'logout' => null,
        'password-reset' => null,
        'register' => null,
        'email-verification' => null,
        'password-confirmation' => null,
    ],
];
