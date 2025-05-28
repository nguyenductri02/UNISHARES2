<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class AnalyzeSessionDistribution extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sessions:analyze {--limit=10 : Limit number of users to show}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Analyze the distribution of sessions across users';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Analyzing session distribution...');
        
        // Get total sessions count
        $totalSessions = DB::table('sessions')
            ->whereNotNull('user_id')
            ->count();
            
        // Get total sessions without user_id
        $anonymousSessions = DB::table('sessions')
            ->whereNull('user_id')
            ->count();
            
        // Get session distribution by user
        $userSessionCounts = DB::table('sessions')
            ->select('user_id', DB::raw('count(*) as session_count'))
            ->whereNotNull('user_id')
            ->groupBy('user_id')
            ->orderBy('session_count', 'desc')
            ->get();
            
        // Count users with multiple sessions
        $usersWithMultipleSessions = $userSessionCounts->filter(function($item) {
            return $item->session_count > 1;
        })->count();
        
        // Count users with exactly one session
        $usersWithOneSession = $userSessionCounts->filter(function($item) {
            return $item->session_count == 1;
        })->count();
        
        // Get total unique users with sessions
        $uniqueUsers = $userSessionCounts->count();
        
        // Output basic stats
        $this->info("Session statistics:");
        $this->info("  - Total sessions with user ID: {$totalSessions}");
        $this->info("  - Anonymous sessions: {$anonymousSessions}");
        $this->info("  - Unique users with sessions: {$uniqueUsers}");
        $this->info("  - Users with exactly one session: {$usersWithOneSession}");
        $this->info("  - Users with multiple sessions: {$usersWithMultipleSessions}");
        
        if ($uniqueUsers > 0) {
            $this->info("  - Average sessions per user: " . round($totalSessions / $uniqueUsers, 2));
        }
        
        // Display users with most sessions
        $limit = $this->option('limit');
        $topUsers = $userSessionCounts->take($limit);
        
        if ($topUsers->isNotEmpty()) {
            $this->info("\nTop {$limit} users by session count:");
            $this->table(
                ['User ID', 'Name', 'Email', 'Session Count', 'Token Count'],
                $topUsers->map(function($item) {
                    $user = User::find($item->user_id);
                    $tokenCount = DB::table('personal_access_tokens')
                        ->where('tokenable_type', 'App\Models\User')
                        ->where('tokenable_id', $item->user_id)
                        ->count();
                        
                    return [
                        'user_id' => $item->user_id,
                        'name' => $user ? $user->name : 'Unknown',
                        'email' => $user ? $user->email : 'Unknown',
                        'session_count' => $item->session_count,
                        'token_count' => $tokenCount
                    ];
                })
            );
        }
        
        return 0;
    }
}
