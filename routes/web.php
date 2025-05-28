<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;
use Laravel\Sanctum\Http\Controllers\CsrfCookieController;

Route::get('/', function () {
    return view('welcome');
});

// Define a login route to prevent "Route [login] not defined" errors
Route::get('/login', function () {
    // Check if the request has a redirect parameter
    $redirectTo = request()->query('redirect_to');
    
    // If it's an API request looking for JSON, return JSON response
    if (request()->expectsJson() || request()->header('Accept') == 'application/json') {
        return response()->json([
            'message' => 'Unauthenticated',
            'login_url' => url('/login'),
            'redirect_to' => $redirectTo,
        ], 401);
    }
    
    // For web requests, return the login view or redirect to frontend login page
    return redirect('/#/login' . ($redirectTo ? '?redirect_to=' . urlencode($redirectTo) : ''));
})->name('login');

// Route to handle API login redirects
Route::get('/moderator/reports/all', function() {
    return redirect('/login?redirect_to=' . urlencode('/moderator/reports/all'));
})->name('moderator.reports.all');

// Make sure Sanctum routes are registered
Route::get('/sanctum/csrf-cookie', [CsrfCookieController::class, 'show']);

// Route to handle storage files
Route::get('/storage/{path}', function($path) {
    // This is a public-facing route, so we should perform validation
    // to ensure users can only access allowed files
    $fullPath = storage_path('app/public/' . $path);
    
    if (!File::exists($fullPath)) {
        abort(404, 'File not found');
    }
    
    // Check if this is an image or document
    $mimeType = File::mimeType($fullPath);
    
    // For security, only allow specific file types to be accessed directly
    $allowedMimeTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'image/svg+xml'
    ];
    
    if (!in_array($mimeType, $allowedMimeTypes)) {
        abort(403, 'File type not allowed for direct access');
    }
    
    $contents = File::get($fullPath);
    
    return response($contents, 200)
        ->header('Content-Type', $mimeType);
})->where('path', '.*');