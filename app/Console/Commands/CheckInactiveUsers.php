<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class CheckInactiveUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:check-inactive {--mark-inactive} {--days=90}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for inactive users and optionally mark them as inactive';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $days = $this->option('days');
        $shouldMarkInactive = $this->option('mark-inactive');
        
        $this->info("Checking for users inactive for more than {$days} days...");
        
        $cutoffDate = now()->subDays($days);
        
        $inactiveUsers = User::where(function($query) use ($cutoffDate) {
            $query->whereNull('last_activity_at')
                  ->orWhere('last_activity_at', '<', $cutoffDate);
        })
        ->where('is_active', true)
        ->get();
        
        $this->info("Found {$inactiveUsers->count()} inactive users.");
        
        if ($shouldMarkInactive && $inactiveUsers->count() > 0) {
            $this->warn("Marking users as inactive...");
            
            foreach ($inactiveUsers as $user) {
                Log::info("Marking user as inactive due to inactivity", [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'last_activity' => $user->last_activity_at
                ]);
                
                // Mark as inactive but DO NOT DELETE
                $user->update([
                    'is_active' => false
                ]);
                
                $this->line("User {$user->email} marked as inactive.");
            }
            
            $this->info("Completed. {$inactiveUsers->count()} users marked as inactive.");
        } else {
            // Just display the inactive users without taking action
            $this->table(
                ['ID', 'Name', 'Email', 'Last Activity'],
                $inactiveUsers->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'last_activity' => $user->last_activity_at ? $user->last_activity_at->diffForHumans() : 'Never'
                    ];
                })
            );
        }
        
        return Command::SUCCESS;
    }
}
