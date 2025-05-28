<?php

namespace App\Http\Controllers\API\Group;

use App\Http\Controllers\Controller;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Models\Group;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Schema;

class GroupDocumentController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Display a listing of documents for a specific group.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Group  $group
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request, Group $group)
    {
        // Check if user is a member of the group
        $isMember = $group->members()->where('user_id', $request->user()->id)->exists();
        $isAdmin = $request->user()->hasRole(['admin', 'moderator']);

        if (!$isMember && !$isAdmin) {
            return response()->json([
                'success' => false,
                'message' => 'You are not a member of this group'
            ], 403);
        }

        try {
            $query = Document::query()
                ->where('group_id', $group->id);
            
            // Check if is_active column exists before adding it to query
            if (Schema::hasColumn('documents', 'is_active')) {
                $query->where('is_active', true);
            }

            // Apply search filter if provided
            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = $request->search;
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('title', 'like', "%{$searchTerm}%")
                      ->orWhere('description', 'like', "%{$searchTerm}%")
                      ->orWhere('file_name', 'like', "%{$searchTerm}%");
                });
            }

            // Add sorting
            $sortField = $request->get('sort_by', 'created_at');
            $sortDirection = $request->get('sort_direction', 'desc');
            $query->orderBy($sortField, $sortDirection);

            // Paginate results
            $perPage = $request->get('per_page', 10);
            $documents = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => DocumentResource::collection($documents),
                'meta' => [
                    'current_page' => $documents->currentPage(),
                    'last_page' => $documents->lastPage(),
                    'per_page' => $documents->perPage(),
                    'total' => $documents->total(),
                ],
            ]);
        } catch (\Exception $e) {
            // Log the error
            \Log::error('Error fetching group documents: ' . $e->getMessage());
            
            // Return a graceful error response
            return response()->json([
                'success' => false,
                'message' => 'Error fetching documents',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created document in the group.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Group  $group
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, Group $group)
    {
        // Check if user is a member of the group
        $member = $group->members()->where('user_id', $request->user()->id)->first();
        $isAdmin = $request->user()->hasRole(['admin', 'moderator']);

        if (!$member && !$isAdmin) {
            return response()->json([
                'success' => false,
                'message' => 'You are not a member of this group'
            ], 403);
        }

        // Check if user can upload documents (admin, moderator, or regular member if allowed)
        $canUpload = $isAdmin || 
                     ($member && in_array($member->role, ['admin', 'moderator'])) || 
                     ($member && $group->members_can_upload);

        if (!$canUpload) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to upload documents to this group'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'file' => 'required|file|max:51200', // 50MB max
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $file = $request->file('file');
            $fileName = $file->getClientOriginalName();
            $fileSize = $file->getSize();
            $fileMimeType = $file->getMimeType();
            $fileExtension = $file->getClientOriginalExtension();

            // Generate a unique filename
            $uniqueFileName = uniqid() . '_' . $fileName;
            $path = $file->storeAs('documents/group_' . $group->id, $uniqueFileName, 'public');

            // Create document record with appropriate fields
            $documentData = [
                'user_id' => $request->user()->id,
                'group_id' => $group->id,
                'title' => $request->title,
                'description' => $request->description,
                'file_path' => $path,
                'file_name' => $fileName,
                'file_size' => $fileSize,
                'file_type' => $fileExtension,
                'mime_type' => $fileMimeType,
                'download_count' => 0,
            ];

            // Add is_active if the column exists
            if (Schema::hasColumn('documents', 'is_active')) {
                $documentData['is_active'] = true;
            }

            // Add is_approved if the column exists
            if (Schema::hasColumn('documents', 'is_approved')) {
                $documentData['is_approved'] = $isAdmin || 
                                            ($member && in_array($member->role, ['admin', 'moderator']));
            }

            $document = Document::create($documentData);

            return response()->json([
                'success' => true,
                'message' => 'Document uploaded successfully',
                'data' => new DocumentResource($document)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload document',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show a specific document in the group.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Group  $group
     * @param  int  $documentId
     * @return \Illuminate\Http\Response
     */
    public function show(Request $request, Group $group, $documentId)
    {
        // Check if user is a member of the group
        $isMember = $group->members()->where('user_id', $request->user()->id)->exists();
        $isAdmin = $request->user()->hasRole(['admin', 'moderator']);

        if (!$isMember && !$isAdmin) {
            return response()->json([
                'success' => false,
                'message' => 'You are not a member of this group'
            ], 403);
        }

        $query = Document::where('id', $documentId)
            ->where('group_id', $group->id);
            
        // Add is_active check if column exists
        if (Schema::hasColumn('documents', 'is_active')) {
            $query->where('is_active', true);
        }
            
        $document = $query->first();

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Document not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new DocumentResource($document)
        ]);
    }

    /**
     * Download a document from the group.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Group  $group
     * @param  int  $documentId
     * @return \Illuminate\Http\Response
     */
    public function download(Request $request, Group $group, $documentId)
    {
        // Check if user is a member of the group
        $isMember = $group->members()->where('user_id', $request->user()->id)->exists();
        $isAdmin = $request->user()->hasRole(['admin', 'moderator']);

        if (!$isMember && !$isAdmin) {
            return response()->json([
                'success' => false,
                'message' => 'You are not a member of this group'
            ], 403);
        }

        $query = Document::where('id', $documentId)
            ->where('group_id', $group->id);
            
        // Add is_active check if column exists
        if (Schema::hasColumn('documents', 'is_active')) {
            $query->where('is_active', true);
        }
            
        $document = $query->first();

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Document not found'
            ], 404);
        }

        if (!Storage::disk('public')->exists($document->file_path)) {
            return response()->json([
                'success' => false,
                'message' => 'File not found on server'
            ], 404);
        }

        // Increment download count
        $document->increment('download_count');

        return Storage::disk('public')->download(
            $document->file_path,
            $document->file_name,
            [
                'Content-Type' => $document->mime_type,
                'Content-Disposition' => 'attachment; filename="' . $document->file_name . '"'
            ]
        );
    }
}
