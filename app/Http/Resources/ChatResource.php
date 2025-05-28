<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Auth;

class ChatResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
     */
    public function toArray($request)
    {
        $currentUser = $request->user();
          return [
            'id' => $this->id,
            'name' => $this->type === 'group' ? $this->name : null,
            'is_group' => $this->type === 'group',
            'avatar' => $this->avatar ? url('storage/' . $this->avatar) : null,
            'type' => $this->type,
            'description' => $this->description,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'last_message_at' => $this->last_message_at,
            
            // Current user data (for UI customization)
            'current_user' => $currentUser ? [
                'id' => $currentUser->id,
                'name' => $currentUser->name,
                'avatar' => $currentUser->avatar ? url('storage/' . $currentUser->avatar) : null,
            ] : null,
            
            // Participants data
            'participants' => $this->whenLoaded('participants', function () {
                return $this->participants
                    ->where('left_at', null)
                    ->map(function ($participant) {
                        return [
                            'id' => $participant->id,
                            'user_id' => $participant->user_id,
                            'is_admin' => $participant->is_admin,
                            'joined_at' => $participant->joined_at,
                            'last_read_at' => $participant->last_read_at,
                            'user' => [
                                'id' => $participant->user->id,
                                'name' => $participant->user->name,
                                'avatar' => $participant->user->avatar ? url('storage/' . $participant->user->avatar) : null,
                            ],
                        ];
                    });
            }),
            
            // Last message data
            'last_message' => $this->whenLoaded('lastMessage', function () {
                $message = $this->lastMessage;
                return [
                    'id' => $message->id,
                    'chat_id' => $message->chat_id,
                    'user_id' => $message->user_id,
                    'content' => $message->content,
                    'created_at' => $message->created_at,
                    'updated_at' => $message->updated_at,
                    'user' => $message->user ? [
                        'id' => $message->user->id,
                        'name' => $message->user->name,
                    ] : null,
                ];
            }),
            
            // Calculated fields
            'is_read' => $this->whenLoaded('participants', function () use ($currentUser) {
                $participant = $this->participants
                    ->where('user_id', $currentUser->id)
                    ->where('left_at', null)
                    ->first();
                
                if (!$participant || !$this->last_message_at) {
                    return true;
                }
                
                return $participant->last_read_at && $participant->last_read_at >= $this->last_message_at;
            }, true),
            
            'unread_count' => $this->when($currentUser, function () use ($currentUser) {
                return $this->unreadCount($currentUser->id);
            }, 0),
        ];
    }
}
