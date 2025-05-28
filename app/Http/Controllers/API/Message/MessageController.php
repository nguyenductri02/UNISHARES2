<?php

namespace App\Http\Controllers\API\Message;

use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Http\Resources\MessageResource;
use App\Models\Chat;
use App\Models\Group;
use App\Models\Message;
use App\Models\FileUpload;
use App\Models\MessageAttachment;
use App\Services\FileUploadService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class MessageController extends Controller
{
    protected $fileUploadService;
    protected $notificationService;
    
    public function __construct(FileUploadService $fileUploadService, NotificationService $notificationService)
    {
        $this->fileUploadService = $fileUploadService;
        $this->notificationService = $notificationService;
        $this->middleware('auth:sanctum');
    }
    
    public function index(Request $request, Chat $chat)
    {
        $userId = $request->user()->id;
        
        // For group chats, check if user is a group member and auto-add as participant if needed
        if ($chat->type === 'group' && $chat->group_id) {
            $group = $chat->group;
            
            if ($group) {
                $isMember = $group->members()->where('user_id', $userId)->where('status', 'approved')->exists();
                $isAdmin = $request->user()->hasRole('admin') || $request->user()->hasRole('moderator');
                
                if (!$isMember && !$isAdmin) {
                    return response()->json(['message' => 'You are not a member of this group'], 403);
                }
                
                // Check if user is a participant, if not add them
                $isParticipant = $chat->participants()->where('user_id', $userId)->exists();
                
                if (!$isParticipant && ($isMember || $isAdmin)) {
                    // Add user as participant since they are a group member
                    $chat->participants()->create([
                        'user_id' => $userId,
                        'is_admin' => false,
                        'joined_at' => now()
                    ]);
                    
                    \Log::info("Auto-added user {$userId} as participant to group chat {$chat->id} for messages access");
                }
            }
        } else {
            // For non-group chats, use the original permission check
            if (!$chat->hasActiveParticipant($userId)) {
                return response()->json(['message' => 'You do not have permission to view messages in this chat'], 403);
            }
        }
        
        $messages = $chat->messages()->with(['user', 'attachments'])->latest()->paginate(20);
        
        // Mark chat as read for this user
        $participant = $chat->participants()->where('user_id', $userId)->first();
        if ($participant) {
            $participant->update(['last_read_at' => now()]);
        }
        
        return MessageResource::collection($messages);
    }
    
    /**
     * Store a newly created message in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Chat  $chat
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, Chat $chat)
    {
        $userId = $request->user()->id;
        
        // For group chats, check if user is a group member and auto-add as participant if needed
        if ($chat->type === 'group' && $chat->group_id) {
            $group = $chat->group;
            
            if ($group) {
                $isMember = $group->members()->where('user_id', $userId)->where('status', 'approved')->exists();
                $isAdmin = $request->user()->hasRole('admin') || $request->user()->hasRole('moderator');
                
                if (!$isMember && !$isAdmin) {
                    return response()->json(['message' => 'You are not a member of this group'], 403);
                }
                
                // Check if user is a participant, if not add them
                $isParticipant = $chat->participants()->where('user_id', $userId)->exists();
                
                if (!$isParticipant && ($isMember || $isAdmin)) {
                    // Add user as participant since they are a group member
                    $chat->participants()->create([
                        'user_id' => $userId,
                        'is_admin' => false,
                        'joined_at' => now()
                    ]);
                    
                    \Log::info("Auto-added user {$userId} as participant to group chat {$chat->id} for sending message");
                }
            }
        } else {
            // For non-group chats, use the original permission check
            $isParticipant = $chat->participants()->where('user_id', $userId)->exists();
            
            if (!$isParticipant) {
                return response()->json(['message' => 'You are not a participant in this chat'], 403);
            }
        }
        
        $validator = Validator::make($request->all(), [
            'content' => 'nullable|string|max:10000',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:10240', // 10MB max per file
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Require either content or attachments
        if (empty($request->content) && !$request->hasFile('attachments')) {
            return response()->json(['message' => 'Message content or attachments are required'], 422);
        }
        
        // Create the message
        $message = new Message();
        $message->chat_id = $chat->id;
        $message->user_id = $userId;
        $message->content = $request->content;
        $message->save();
        
        // Process attachments if any
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $fileName = $file->getClientOriginalName();
                $fileSize = $file->getSize();
                $fileType = $file->getMimeType();
                
                // Generate a unique name for the file
                $uniqueFileName = Str::uuid() . '_' . $fileName;
                
                // Store the file
                $filePath = $file->storeAs('message_attachments', $uniqueFileName, 'public');
                
                // Create attachment record
                $attachment = new MessageAttachment([
                    'message_id' => $message->id,
                    'file_name' => $fileName,
                    'file_path' => $filePath,
                    'file_size' => $fileSize,
                    'file_type' => $fileType,
                ]);
                
                $attachment->save();
            }
        }
        
        // Update the chat's updated_at timestamp
        $chat->touch();
        
        // Load the message with user and attachments
        $message->load('user', 'attachments');
        
        // Broadcast the message to chat participants
        broadcast(new MessageSent($message))->toOthers();
        
        // Process any emoji in the content
        if (!empty($message->content)) {
            // Using a simple emoji processing for display
            // In a real implementation, you might want to use a proper emoji library
        }
        
        return response()->json($message);
    }
    
    public function markAsRead(Request $request, Chat $chat)
    {
        $userId = $request->user()->id;
        
        // For group chats, check if user is a group member and auto-add as participant if needed
        if ($chat->type === 'group' && $chat->group_id) {
            $group = $chat->group;
            
            if ($group) {
                $isMember = $group->members()->where('user_id', $userId)->where('status', 'approved')->exists();
                $isAdmin = $request->user()->hasRole('admin') || $request->user()->hasRole('moderator');
                
                if (!$isMember && !$isAdmin) {
                    return response()->json(['message' => 'You are not a member of this group'], 403);
                }
                
                // Check if user is a participant, if not add them
                $isParticipant = $chat->participants()->where('user_id', $userId)->exists();
                
                if (!$isParticipant && ($isMember || $isAdmin)) {
                    // Add user as participant since they are a group member
                    $chat->participants()->create([
                        'user_id' => $userId,
                        'is_admin' => false,
                        'joined_at' => now()
                    ]);
                    
                    \Log::info("Auto-added user {$userId} as participant to group chat {$chat->id} for mark as read");
                }
            }
        } else {
            // For non-group chats, use the original permission check
            if (!$chat->hasActiveParticipant($userId)) {
                return response()->json(['message' => 'You do not have permission to access this chat'], 403);
            }
        }
        
        // Update the user's last_read_at timestamp for this chat
        $participant = $chat->participants()->where('user_id', $userId)->first();
        if ($participant) {
            $participant->update(['last_read_at' => now()]);
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Chat marked as read'
        ]);
    }
    
    public function destroy(Request $request, Chat $chat, Message $message)
    {
        $userId = $request->user()->id;
        
        // Check if user is the sender of this message
        if ($message->user_id !== $userId) {
            return response()->json(['message' => 'You do not have permission to delete this message'], 403);
        }
        
        // Delete message attachments if they exist
        foreach ($message->attachments as $attachment) {
            try {
                // Find the file upload record if available
                $fileUpload = FileUpload::where('file_path', $attachment->file_path)->first();
                
                if ($fileUpload) {
                    $this->fileUploadService->deleteFileUpload($fileUpload);
                }
                
                // Delete the attachment record
                $attachment->delete();
            } catch (\Exception $e) {
                // Log the error but continue with message deletion
                \Log::error('Failed to delete message attachment: ' . $e->getMessage());
            }
        }
        
        $message->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Message deleted successfully'
        ]);
    }
}
