<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SessionsAnalyze extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sessions:analyze {--user= : Analyze sessions for a specific user ID}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Analyze session data in the database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('=== Session Analysis Report ===');
        
        // Get specific user filter if provided
        $userId = $this->option('user');
        if ($userId) {
            $this->info("Analyzing sessions for User ID: {$userId}");
        }
        
        // Get basic statistics
        $totalSessions = DB::table('sessions')->count();
        $usersWithSessions = DB::table('sessions')
            ->whereNotNull('user_id')
            ->distinct('user_id')
            ->count();
        $anonymousSessions = DB::table('sessions')
            ->whereNull('user_id')
            ->count();
        
        $this->info("Total sessions: {$totalSessions}");
        $this->info("Users with active sessions: {$usersWithSessions}");
        $this->info("Anonymous sessions: {$anonymousSessions}");
        
        // Analyze sessions by user
        $sessionQuery = DB::table('sessions')
            ->select('user_id', DB::raw('count(*) as session_count'))
            ->whereNotNull('user_id');
        
        if ($userId) {
            $sessionQuery->where('user_id', $userId);
        }
        
        $sessionsByUser = $sessionQuery
            ->groupBy('user_id')
            ->orderBy('session_count', 'desc')
            ->limit(10)
            ->get();
        
        if ($sessionsByUser->isNotEmpty()) {
            $this->info("\nTop users by session count:");
            $this->table(
                ['User ID', 'Session Count'],
                $sessionsByUser->map(function ($item) {
                    return [
                        'User ID' => $item->user_id,
                        'Session Count' => $item->session_count
                    ];
                })->toArray()
            );
        }
        
        // Analyze tokens
        $tokenQuery = DB::table('personal_access_tokens')
            ->select('tokenable_id', DB::raw('count(*) as token_count'))
            ->where('tokenable_type', 'App\\Models\\User');
        
        if ($userId) {
            $tokenQuery->where('tokenable_id', $userId);
        }
        
        $tokensByUser = $tokenQuery
            ->groupBy('tokenable_id')
            ->orderBy('token_count', 'desc')
            ->limit(10)
            ->get();
        
        if ($tokensByUser->isNotEmpty()) {
            $this->info("\nTop users by token count:");
            $this->table(
                ['User ID', 'Token Count'],
                $tokensByUser->map(function ($item) {
                    return [
                        'User ID' => $item->tokenable_id,
                        'Token Count' => $item->token_count
                    ];
                })->toArray()
            );
        }
        
        // Detailed analysis for specific user
        if ($userId) {
            $this->info("\nDetailed session data for User ID: {$userId}");
            
            $sessions = DB::table('sessions')
                ->where('user_id', $userId)
                ->get();
            
            $sessionData = [];
            foreach ($sessions as $session) {
                $payload = unserialize(base64_decode($session->payload));
                $lastActivity = Carbon::createFromTimestamp($session->last_activity);
                
                $sessionData[] = [
                    'Session ID' => $session->id,
                    'IP Address' => $session->ip_address,
                    'User Agent' => substr($session->user_agent, 0, 30) . '...',
                    'Last Activity' => $lastActivity->diffForHumans(),
                    'Expiration' => $lastActivity->addMinutes(config('session.lifetime'))->diffForHumans()
                ];
            }
            
            if (count($sessionData) > 0) {
                $this->table(
                    ['Session ID', 'IP Address', 'User Agent', 'Last Activity', 'Expiration'],
                    $sessionData
                );
            } else {
                $this->warn("No sessions found for User ID: {$userId}");
            }
            
            // Token information
            $tokens = DB::table('personal_access_tokens')
                ->where('tokenable_id', $userId)
                ->where('tokenable_type', 'App\\Models\\User')
                ->get();
            
            $tokenData = [];
            foreach ($tokens as $token) {
                $expiresAt = $token->expires_at ? Carbon::parse($token->expires_at) : null;
                
                $tokenData[] = [
                    'ID' => $token->id,
                    'Name' => $token->name,
                    'Created' => Carbon::parse($token->created_at)->diffForHumans(),
                    'Last Used' => $token->last_used_at ? Carbon::parse($token->last_used_at)->diffForHumans() : 'Never',
                    'Expiration' => $expiresAt ? $expiresAt->diffForHumans() : 'Never'
                ];
            }
            
            if (count($tokenData) > 0) {
                $this->info("\nAccess tokens for User ID: {$userId}");
                $this->table(
                    ['ID', 'Name', 'Created', 'Last Used', 'Expiration'],
                    $tokenData
                );
            } else {
                $this->warn("No tokens found for User ID: {$userId}");
            }
        }
        
        $this->info("\n=== End of Session Analysis ===");
    }
}
