<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * The Artisan commands provided by your application.
     *
     * @var array
     */
    protected $commands = [
        Commands\SessionsCleanup::class,
        Commands\SessionsAnalyze::class,
    ];
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Clean up expired sessions every day
        $schedule->call(function () {
            // Clean up expired sessions based on the last_activity timestamp
            $sessionLifetime = config('session.lifetime', 120); // in minutes
            $cutoffTime = now()->subMinutes($sessionLifetime)->timestamp;
            
            // Delete expired sessions where last_activity is older than the session lifetime
            $deletedSessions = \DB::table('sessions')
                ->where('last_activity', '<', $cutoffTime)
                ->delete();
                
            \Illuminate\Support\Facades\Log::info("Cleaned up expired sessions", [
                'deleted_count' => $deletedSessions, 
                'session_lifetime' => $sessionLifetime,
                'cutoff_time' => date('Y-m-d H:i:s', $cutoffTime)
            ]);
        })->daily();
        
        // Clean up orphaned sessions - sessions with user_id but no matching token
        $schedule->call(function () {
            // Get all user IDs with active sessions
            $userIdsWithSessions = \DB::table('sessions')
                ->whereNotNull('user_id')
                ->distinct()
                ->pluck('user_id');
                
            $deletedCount = 0;
            
            foreach ($userIdsWithSessions as $userId) {
                // Check if the user has an active token
                $hasToken = \DB::table('personal_access_tokens')
                    ->where('tokenable_type', 'App\Models\User')
                    ->where('tokenable_id', $userId)
                    ->exists();
                    
                // If no token exists, delete all sessions for this user
                if (!$hasToken) {
                    $userSessionsDeleted = \DB::table('sessions')
                        ->where('user_id', $userId)
                        ->delete();
                        
                    $deletedCount += $userSessionsDeleted;
                }
            }
            
            \Illuminate\Support\Facades\Log::info("Cleaned up orphaned sessions", [
                'deleted_count' => $deletedCount
            ]);
        })->dailyAt('01:30');
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
