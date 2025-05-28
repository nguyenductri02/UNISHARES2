<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class CleanupOrphanedSessions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sessions:cleanup {--force : Force cleanup of all sessions with user_id}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up orphaned sessions in the database (sessions with user_id but no matching token)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting session cleanup...');
        
        // Check if tables exist
        if (!Schema::hasTable('sessions')) {
            $this->error('Sessions table does not exist!');
            return 1;
        }
        
        if (!Schema::hasTable('personal_access_tokens')) {
            $this->error('Personal access tokens table does not exist!');
            return 1;
        }
        
        // Force option will delete all sessions with user_id
        if ($this->option('force')) {
            $count = DB::table('sessions')
                ->whereNotNull('user_id')
                ->delete();
                
            $this->info("Forcefully deleted {$count} sessions with user_id");
            
            Log::info("Forcefully cleaned up all user sessions", [
                'deleted_count' => $count,
                'initiated_by' => 'command',
                'force_mode' => true
            ]);
            
            return 0;
        }
        
        // Normal operation - only delete orphaned sessions
        // Get all user IDs with active sessions
        $userIdsWithSessions = DB::table('sessions')
            ->whereNotNull('user_id')
            ->distinct()
            ->pluck('user_id');
            
        $this->info("Found " . count($userIdsWithSessions) . " users with active sessions");
        
        $totalDeleted = 0;
        $usersWithoutTokens = 0;
        
        $this->output->progressStart(count($userIdsWithSessions));
        
        foreach ($userIdsWithSessions as $userId) {
            // Check if the user has an active token
            $hasToken = DB::table('personal_access_tokens')
                ->where('tokenable_type', 'App\Models\User')
                ->where('tokenable_id', $userId)
                ->exists();
                
            // If no token exists, delete all sessions for this user
            if (!$hasToken) {
                $userSessionCount = DB::table('sessions')
                    ->where('user_id', $userId)
                    ->count();
                    
                $deleted = DB::table('sessions')
                    ->where('user_id', $userId)
                    ->delete();
                    
                $totalDeleted += $deleted;
                $usersWithoutTokens++;
                
                $this->info("  - User {$userId}: Deleted {$deleted} sessions (had {$userSessionCount})");
            }
            
            $this->output->progressAdvance();
        }
        
        $this->output->progressFinish();
        
        $this->info("Cleanup complete!");
        $this->info("  - {$usersWithoutTokens} users had sessions without tokens");
        $this->info("  - {$totalDeleted} orphaned sessions were deleted");
        
        Log::info("Cleaned up orphaned sessions", [
            'deleted_count' => $totalDeleted,
            'users_without_tokens' => $usersWithoutTokens,
            'initiated_by' => 'command'
        ]);
        
        return 0;
    }
}
