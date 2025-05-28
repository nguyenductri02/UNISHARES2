<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SessionsCleanup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sessions:cleanup {--force : Force cleanup of all sessions}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up expired or orphaned sessions';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting sessions cleanup...');
        
        $force = $this->option('force');
        
        if ($force) {
            // Force cleanup all sessions
            $this->warn('Forcing cleanup of all sessions!');
            $count = DB::table('sessions')->delete();
            $this->info("Deleted {$count} sessions");
            
            $count = DB::table('personal_access_tokens')->delete();
            $this->info("Deleted {$count} tokens");
            
            return;
        }
        
        // Clean expired sessions (older than session lifetime)
        $lifetime = config('session.lifetime', 120);
        $cutoff = Carbon::now()->subMinutes($lifetime)->timestamp;
        
        $count = DB::table('sessions')
            ->where('last_activity', '<', $cutoff)
            ->delete();
        
        $this->info("Deleted {$count} expired sessions");
        
        // Clean expired tokens
        $count = DB::table('personal_access_tokens')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', Carbon::now())
            ->delete();
        
        $this->info("Deleted {$count} expired tokens");
        
        // Find orphaned sessions (sessions with user_id but no token)
        $orphanedSessions = DB::select("
            SELECT s.user_id, COUNT(*) as session_count
            FROM sessions s
            WHERE s.user_id IS NOT NULL
            AND NOT EXISTS (
                SELECT 1 FROM personal_access_tokens t 
                WHERE t.tokenable_id = s.user_id 
                AND t.tokenable_type = 'App\\Models\\User'
            )
            GROUP BY s.user_id
        ");
        
        if (count($orphanedSessions) > 0) {
            $this->warn('Found orphaned sessions:');
            $this->table(['User ID', 'Sessions'], 
                collect($orphanedSessions)->map(function($s) {
                    return ['User ID' => $s->user_id, 'Sessions' => $s->session_count];
                })->toArray()
            );
            
            if ($this->confirm('Do you want to delete orphaned sessions?')) {
                $userIds = collect($orphanedSessions)->pluck('user_id')->toArray();
                $count = DB::table('sessions')
                    ->whereIn('user_id', $userIds)
                    ->delete();
                
                $this->info("Deleted {$count} orphaned sessions");
            }
        } else {
            $this->info('No orphaned sessions found');
        }
        
        $this->info('Session cleanup completed');
    }
}
