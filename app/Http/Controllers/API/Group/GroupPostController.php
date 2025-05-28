<?php

namespace App\Http\Controllers\API\Group;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Group;
use App\Models\Post;
use App\Services\FileUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class GroupPostController extends Controller
{
    protected $fileUploadService;
    
    public function __construct(FileUploadService $fileUploadService)
    {
        $this->fileUploadService = $fileUploadService;
        $this->middleware('auth:sanctum');
    }
    
    /**
     * Get all posts for a specific group
     * 
     * @param Request $request
     * @param Group $group
     * @return \Illuminate\Http\JsonResponse
     */
    public function getGroupPosts(Request $request, Group $group)
    {
        // Check if user can view posts in this group
        if ($group->is_private) {
            $isMember = $group->members()->where('user_id', $request->user()->id)->exists();
            
            if (!$isMember && !$request->user()->hasRole(['admin', 'moderator'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to view posts in this group'
                ], 403);
            }
        }
        
        try {
            // Enable query logging if in debug mode
            if (config('app.debug')) {
                \DB::enableQueryLog();
            }
            
            // Get posts with pagination
            $posts = $group->posts()
                ->with(['author', 'group', 'attachments', 'likes'])
                ->withCount(['comments', 'likes'])
                ->orderBy('created_at', 'desc')
                ->paginate($request->input('per_page', 10));
            
            // Safely log the query if enabled - FIX: properly handle end() function with a variable
            if (config('app.debug') && count(\DB::getQueryLog()) > 0) {
                $queryLog = \DB::getQueryLog();
                $lastQuery = end($queryLog); // Fix: store result of end() in a variable first
                Log::info('Posts query executed: ' . json_encode($lastQuery));
            }
            
            // Check if the user has liked each post
            $posts->getCollection()->transform(function ($post) use ($request) {
                $post->is_liked = $post->likes()->where('user_id', $request->user()->id)->exists();
                $post->can_edit = $post->user_id === $request->user()->id || $request->user()->hasRole(['admin', 'moderator']);
                $post->can_delete = $post->user_id === $request->user()->id || $request->user()->hasRole(['admin', 'moderator']);
                
                return $post;
            });
            
            return response()->json([
                'success' => true,
                'data' => PostResource::collection($posts),
                'meta' => [
                    'current_page' => $posts->currentPage(),
                    'last_page' => $posts->lastPage(),
                    'per_page' => $posts->perPage(),
                    'total' => $posts->total()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error in getGroupPosts: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Create a new post in a group
     * 
     * @param Request $request
     * @param Group $group
     * @return \Illuminate\Http\JsonResponse
     */
    public function createGroupPost(Request $request, Group $group)
    {
        // Check if user is a member of the group
        $isMember = $group->members()->where('user_id', $request->user()->id)->exists();
        
        if (!$isMember && !$request->user()->hasRole(['admin', 'moderator'])) {
            return response()->json([
                'success' => false,
                'message' => 'You must be a member of this group to create posts'
            ], 403);
        }
        
        // Validate request - use 'attachments' instead of 'attachments.*'
        $validator = Validator::make($request->all(), [
            'content' => 'required_without:attachments|string|nullable',
            'title' => 'nullable|string|max:255',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:20480' // 20MB max file size
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }
        
        // Debug - extensively log the incoming request
        Log::info('Creating group post with data: ', [
            'content' => $request->input('content'),
            'title' => $request->input('title'),
            'has_files' => $request->hasFile('attachments'),
            'files_count' => $request->hasFile('attachments') ? count($request->file('attachments')) : 0,
            'content_type' => $request->header('Content-Type'),
            'all_input' => $request->all(),
            'all_files' => $request->allFiles(),
        ]);
        
        // Create the post with all fields including title
        $post = new Post();
        $post->content = $request->input('content');
        $post->title = $request->input('title'); // Add title field
        $post->user_id = $request->user()->id;
        $post->group_id = $group->id;
        $post->save();
        
        // Handle attachments - improved error handling and debugging
        if ($request->hasFile('attachments')) {
            $fileCount = 0;
            foreach ($request->file('attachments') as $file) {
                try {
                    // Log details about the file being processed
                    Log::info('Processing attachment:', [
                        'file_name' => $file->getClientOriginalName(),
                        'file_size' => $file->getSize(),
                        'mime_type' => $file->getMimeType(),
                    ]);
                    
                    $fileUpload = $this->fileUploadService->uploadFile(
                        $file,
                        $request->user()->id,
                        'post_attachment'
                    );
                    
                    // Log successful file upload
                    Log::info('File uploaded successfully:', [
                        'file_upload_id' => $fileUpload->id,
                        'file_path' => $fileUpload->file_path,
                    ]);
                    
                    // Check if file_upload_id column exists in post_attachments table
                    $hasFileUploadIdColumn = Schema::hasColumn('post_attachments', 'file_upload_id');
                    
                    // Create attachment record
                    $attachmentData = [
                        'file_path' => $fileUpload->file_path,
                        'file_name' => $file->getClientOriginalName(),
                        'file_type' => $file->getMimeType(),
                        'file_size' => $file->getSize(),
                        'file_hash' => $fileUpload->file_hash ?? md5_file($file->getRealPath()), // Add file_hash field
                    ];
                    
                    // Only add file_upload_id if the column exists
                    if ($hasFileUploadIdColumn) {
                        $attachmentData['file_upload_id'] = $fileUpload->id;
                    }
                    
                    $attachment = $post->attachments()->create($attachmentData);
                    
                    // Log successful attachment creation
                    Log::info('Attachment record created:', [
                        'attachment_id' => $attachment->id,
                        'has_file_upload_id_column' => $hasFileUploadIdColumn
                    ]);
                    
                    $fileCount++;
                } catch (\Exception $e) {
                    // Log error with detailed information
                    Log::error('Failed to upload post attachment: ' . $e->getMessage(), [
                        'exception' => $e,
                        'file_name' => $file->getClientOriginalName(),
                        'trace' => $e->getTraceAsString()
                    ]);
                }
            }
            
            // Log summary of attachment processing
            Log::info("Processed $fileCount attachments for post {$post->id}");
        } else {
            Log::info("No attachments found in the request for post {$post->id}");
        }
        
        // Get the post with relationships for the response
        $post->load(['author', 'group', 'attachments']);
        $post->comments_count = 0;
        $post->likes_count = 0;
        $post->is_liked = false;
        $post->can_edit = true;
        $post->can_delete = true;
        
        return response()->json([
            'success' => true,
            'message' => 'Post created successfully',
            'data' => new PostResource($post)
        ], 201);
    }
}
