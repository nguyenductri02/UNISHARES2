<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Notifications\DatabaseNotification;

class NotificationService
{
    /**
     * Send a notification to a user
     * 
     * @param User|int $user The user or user ID to send the notification to
     * @param string $type The notification type
     * @param string $message The notification message
     * @param array $data Additional data for the notification
     * @return DatabaseNotification The created notification
     */
    public function sendNotification($user, string $type, string $message, array $data = []): DatabaseNotification
    {
        try {
            // If $user is an ID, get the user model
            if (is_numeric($user)) {
                $user = User::findOrFail($user);
            }
            
            // Laravel's built-in notification system uses the notifiable_* columns
            $notificationData = array_merge(['message' => $message], $data);
            
            $notification = $user->notifications()->create([
                'id' => \Illuminate\Support\Str::uuid()->toString(),
                'type' => $type,
                'data' => json_encode($notificationData),
            ]);
            
            // Here you could add code to push the notification
            // through WebSockets, Firebase, or any other real-time service
            
            return $notification;
        } catch (\Exception $e) {
            Log::error('Failed to send notification: ' . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Send a notification to multiple users
     * 
     * @param array $users Array of User models or user IDs
     * @param string $type The notification type
     * @param string $message The notification message
     * @param array $data Additional data for the notification
     * @return array Array of created notifications
     */
    public function sendNotificationToMany(array $users, string $type, string $message, array $data = []): array
    {
        $notifications = [];
        
        foreach ($users as $user) {
            try {
                $notifications[] = $this->sendNotification($user, $type, $message, $data);
            } catch (\Exception $e) {
                $userId = is_numeric($user) ? $user : $user->id;
                Log::error('Failed to send notification to user ' . $userId . ': ' . $e->getMessage());
                // Continue with other users even if one fails
                continue;
            }
        }
        
        return $notifications;
    }
    
    /**
     * Mark a notification as read
     * 
     * @param DatabaseNotification $notification The notification to mark as read
     * @return DatabaseNotification The updated notification
     */
    public function markAsRead(DatabaseNotification $notification): DatabaseNotification
    {
        $notification->markAsRead();
        return $notification;
    }
    
    /**
     * Mark all notifications as read for a user
     * 
     * @param User $user The user whose notifications should be marked as read
     * @return int The number of updated notifications
     */
    public function markAllAsRead(User $user): int
    {
        return $user->unreadNotifications()->update(['read_at' => now()]);
    }
}
