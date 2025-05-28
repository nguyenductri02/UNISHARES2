<?php

namespace App\Http\Controllers\API\Message;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\Chat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class MessageAttachmentController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Upload a file attachment for a message
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $messageId
     * @return \Illuminate\Http\Response
     */
    public function upload(Request $request, $messageId)
    {
        try {
            // Find the message
            $message = Message::findOrFail($messageId);
            
            // Check if user is authorized to attach files to this message
            if ($message->user_id !== $request->user()->id) {
                return response()->json([
                    'message' => 'You are not authorized to attach files to this message'
                ], 403);
            }
            
            // Validate the file
            $request->validate([
                'file' => 'required|file|max:10240', // 10MB max
            ]);
            
            $file = $request->file('file');
            $fileName = $file->getClientOriginalName();
            $fileSize = $file->getSize();
            $fileType = $file->getMimeType();
            
            // Generate a unique name for the file
            $uniqueFileName = Str::uuid() . '_' . $fileName;
            
            // Store the file
            $filePath = $file->storeAs('message_attachments', $uniqueFileName, 'public');
            
            // Create attachment record
            $attachment = new MessageAttachment([
                'message_id' => $messageId,
                'file_name' => $fileName,
                'file_path' => $filePath,
                'file_size' => $fileSize,
                'file_type' => $fileType,
            ]);
            
            $attachment->save();
            
            // Return the attachment data
            return response()->json([
                'success' => true,
                'data' => $attachment,
                'download_url' => $attachment->getDownloadUrl(),
            ]);
        } catch (\Exception $e) {
            Log::error('Error uploading message attachment: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload attachment: ' . $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Download a file attachment
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function download($id)
    {
        try {
            $attachment = MessageAttachment::findOrFail($id);
            $message = $attachment->message;
            
            // Check if user can access this attachment
            $user = request()->user();
            $chat = $message->chat;
            
            $isParticipant = $chat->participants()->where('user_id', $user->id)->exists();
            
            if (!$isParticipant && !$user->hasRole(['admin', 'moderator'])) {
                return response()->json([
                    'message' => 'You are not authorized to download this attachment'
                ], 403);
            }
            
            // Get the file path
            $filePath = Storage::disk('public')->path($attachment->file_path);
            
            if (!file_exists($filePath)) {
                return response()->json([
                    'message' => 'File not found'
                ], 404);
            }
            
            // Return the file for download
            return response()->download($filePath, $attachment->file_name);
        } catch (\Exception $e) {
            Log::error('Error downloading message attachment: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to download attachment: ' . $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Get attachment information
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        try {
            $attachment = MessageAttachment::findOrFail($id);
            $message = $attachment->message;
            
            // Check if user can access this attachment
            $user = request()->user();
            $chat = $message->chat;
            
            $isParticipant = $chat->participants()->where('user_id', $user->id)->exists();
            
            if (!$isParticipant && !$user->hasRole(['admin', 'moderator'])) {
                return response()->json([
                    'message' => 'You are not authorized to access this attachment'
                ], 403);
            }
            
            // Return attachment info
            return response()->json([
                'success' => true,
                'data' => $attachment,
                'download_url' => $attachment->getDownloadUrl(),
                'is_image' => $attachment->isImage(),
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting message attachment: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to get attachment: ' . $e->getMessage(),
            ], 500);
        }
    }
}
