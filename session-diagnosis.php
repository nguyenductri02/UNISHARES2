#!/usr/bin/env php
<?php

// Script to diagnose session issues in the terminal without requiring artisan
// Save this file as session-diagnosis.php in the root of your Laravel project
// Run it with: php session-diagnosis.php

// Bootstrap the Laravel application
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=======================================\n";
echo "Session and Token Diagnostic Report\n";
echo "=======================================\n\n";

// Get statistics
$totalSessions = DB::table('sessions')->count();
$usersWithSessions = DB::table('sessions')->whereNotNull('user_id')->distinct('user_id')->count();
$anonymousSessions = DB::table('sessions')->whereNull('user_id')->count();
$totalTokens = DB::table('personal_access_tokens')->count();
$usersWithTokens = DB::table('personal_access_tokens')
    ->where('tokenable_type', 'App\Models\User')
    ->distinct('tokenable_id')
    ->count();

// Print summary
echo "SUMMARY:\n";
echo "  - Total sessions in database: {$totalSessions}\n";
echo "  - Unique users with sessions: {$usersWithSessions}\n";
echo "  - Anonymous sessions: {$anonymousSessions}\n";
echo "  - Total API tokens: {$totalTokens}\n";
echo "  - Unique users with tokens: {$usersWithTokens}\n\n";

// Find problematic cases
echo "POTENTIAL ISSUES:\n";

// Users with multiple sessions
$multipleSessionUsers = DB::table('sessions')
    ->select('user_id', DB::raw('count(*) as session_count'))
    ->whereNotNull('user_id')
    ->groupBy('user_id')
    ->having('session_count', '>', 1)
    ->orderBy('session_count', 'desc')
    ->take(10)
    ->get();

if ($multipleSessionUsers->count() > 0) {
    echo "Users with multiple sessions:\n";
    echo str_repeat('-', 50) . "\n";
    echo sprintf("%-10s %-10s %-30s\n", "User ID", "Sessions", "Last Activity");
    echo str_repeat('-', 50) . "\n";
    
    foreach ($multipleSessionUsers as $user) {
        // Get the most recent activity
        $lastActivity = DB::table('sessions')
            ->where('user_id', $user->user_id)
            ->max('last_activity');
            
        if ($lastActivity) {
            $lastActivityDate = date('Y-m-d H:i:s', $lastActivity);
        } else {
            $lastActivityDate = 'N/A';
        }
        
        echo sprintf("%-10s %-10s %-30s\n", 
            $user->user_id, 
            $user->session_count,
            $lastActivityDate
        );
    }
    echo "\n";
} else {
    echo "No users with multiple sessions found.\n\n";
}

// Users with sessions but no tokens
$sessionsNoTokens = DB::select("
    SELECT s.user_id, COUNT(*) as session_count
    FROM sessions s
    WHERE s.user_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM personal_access_tokens t 
        WHERE t.tokenable_id = s.user_id 
        AND t.tokenable_type = 'App\\Models\\User'
    )
    GROUP BY s.user_id
    ORDER BY session_count DESC
    LIMIT 10
");

if (count($sessionsNoTokens) > 0) {
    echo "Users with sessions but no tokens (orphaned sessions):\n";
    echo str_repeat('-', 40) . "\n";
    echo sprintf("%-10s %-10s\n", "User ID", "Sessions");
    echo str_repeat('-', 40) . "\n";
    
    foreach ($sessionsNoTokens as $user) {
        echo sprintf("%-10s %-10s\n", 
            $user->user_id, 
            $user->session_count
        );
    }
    echo "\n";
} else {
    echo "No users with orphaned sessions found.\n\n";
}

// Users with tokens but no sessions
$tokensNoSessions = DB::select("
    SELECT t.tokenable_id as user_id, COUNT(*) as token_count
    FROM personal_access_tokens t
    WHERE t.tokenable_type = 'App\\Models\\User'
    AND NOT EXISTS (
        SELECT 1 FROM sessions s 
        WHERE s.user_id = t.tokenable_id
    )
    GROUP BY t.tokenable_id
    ORDER BY token_count DESC
    LIMIT 10
");

if (count($tokensNoSessions) > 0) {
    echo "Users with tokens but no sessions:\n";
    echo str_repeat('-', 40) . "\n";
    echo sprintf("%-10s %-10s\n", "User ID", "Tokens");
    echo str_repeat('-', 40) . "\n";
    
    foreach ($tokensNoSessions as $user) {
        echo sprintf("%-10s %-10s\n", 
            $user->user_id, 
            $user->token_count
        );
    }
    echo "\n";
} else {
    echo "No users with tokens but no sessions found.\n\n";
}

// Recommendations
echo "RECOMMENDATIONS:\n";
echo "1. Run 'php artisan sessions:cleanup' to remove orphaned sessions\n";
echo "2. Run 'php artisan sessions:analyze' for more detailed analysis\n";
echo "3. Check the logout implementation in AuthController\n";
echo "4. Ensure the SessionTokenConsistencyMiddleware is registered\n\n";

echo "For immediate cleanup of all problematic sessions, run:\n";
echo "php artisan sessions:cleanup --force\n\n";

echo "=======================================\n";
echo "End of Diagnostic Report\n";
echo "=======================================\n";
