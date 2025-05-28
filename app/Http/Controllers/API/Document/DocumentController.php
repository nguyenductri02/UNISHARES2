<?php

namespace App\Http\Controllers\API\Document;

use App\Events\DocumentUploaded;
use App\Http\Controllers\Controller;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Models\User;
use App\Models\Report;
use App\Services\FileUploadService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Database\Eloquent\SoftDeletes;

class DocumentController extends Controller
{
    protected $fileUploadService;
    protected $notificationService;
    
    public function __construct(FileUploadService $fileUploadService, NotificationService $notificationService)
    {
        $this->fileUploadService = $fileUploadService;
        $this->notificationService = $notificationService;
        $this->middleware('auth:sanctum');
        $this->middleware('permission:delete any document', ['only' => ['approve', 'reject']]);
    }
    
    public function index(Request $request)
    {
        $query = Document::query();
        
        // Apply filters
        if ($request->has('subject')) {
            $query->where('subject', $request->subject);
        }
        
        if ($request->has('course_code')) {
            $query->where('course_code', $request->course_code);
        }
        
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        
        // Only show approved documents to regular users
        if (!$request->user()->hasRole(['admin', 'moderator'])) {
            $query->where('is_approved', true);
        }
        
        // Sort by latest or most downloaded
        if ($request->has('sort') && $request->sort === 'downloads') {
            $query->orderBy('download_count', 'desc');
        } else {
            $query->latest();
        }
        
        $documents = $query->paginate(15);
        
        return DocumentResource::collection($documents);
    }
    
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'subject' => 'nullable|string|max:255',
            'course_code' => 'nullable|string|max:255',
            'file' => 'required|file|max:102400', // 100MB max
            'storage_type' => 'nullable|string|in:local,google_drive,minio',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Check if user has permission to upload documents
        if (!$request->user()->can('upload document')) {
            return response()->json(['message' => 'You do not have permission to upload documents'], 403);
        }
        
        // Upload the file
        try {
            $fileUpload = $this->fileUploadService->uploadFile(
                $request->file('file'),
                $request->user()->id,
                'document',
                null,
                $request->storage_type
            );
            
            // Create the document record
            $document = Document::create([
                'user_id' => $request->user()->id,
                'title' => $request->title,
                'description' => $request->description,
                'file_path' => $fileUpload->file_path,
                'file_name' => $fileUpload->original_filename,
                'file_type' => $fileUpload->file_type,
                'file_size' => $fileUpload->file_size,
                'file_hash' => $fileUpload->file_hash,
                'subject' => $request->subject,
                'course_code' => $request->course_code,
                'is_official' => $request->user()->hasRole('lecturer') && $request->has('is_official') ? $request->is_official : false,
                'is_approved' => $request->user()->hasRole(['admin', 'moderator', 'lecturer']) ? true : false,
                'storage_type' => $fileUpload->storage_type,
            ]);
            
            // Broadcast the document upload event
            broadcast(new DocumentUploaded($document))->toOthers();
            
            // Send notification to moderators if document needs approval
            if (!$document->is_approved) {
                $moderators = User::role('moderator')->get();
                foreach ($moderators as $moderator) {
                    $this->notificationService->sendNotification(
                        $moderator->id,
                        'document_pending_approval',
                        "New document '{$document->title}' needs approval",
                        ['document_id' => $document->id]
                    );
                }
            }
            
            return new DocumentResource($document);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
    
    public function initiateChunkedUpload(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file_name' => 'required|string',
            'file_size' => 'required|integer',
            'total_chunks' => 'required|integer',
            'storage_type' => 'nullable|string|in:local,google_drive,minio',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Check if user has permission to upload documents
        if (!$request->user()->can('upload document')) {
            return response()->json(['message' => 'You do not have permission to upload documents'], 403);
        }
        
        try {
            $fileUpload = $this->fileUploadService->initializeUpload(
                null, // No file yet, just initializing
                $request->user()->id,
                'document',
                null,
                $request->total_chunks,
                $request->storage_type
            );
            
            return response()->json([
                'upload_id' => $fileUpload['upload_session_id'],
                'status' => 'initiated'
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
    
    public function uploadChunk(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'upload_id' => 'required|string',
            'chunk' => 'required|file',
            'chunk_number' => 'required|integer',
            'total_chunks' => 'required|integer',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        try {
            $fileUpload = $this->fileUploadService->processChunk(
                $request->file('chunk'),
                $request->upload_id,
                $request->chunk_number,
                $request->total_chunks
            );
            
            return response()->json([
                'upload_id' => $request->upload_id,
                'chunks_received' => $fileUpload->chunks_received,
                'status' => $fileUpload->status
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
    
    public function finalizeChunkedUpload(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'upload_id' => 'required|string',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'subject' => 'nullable|string|max:255',
            'course_code' => 'nullable|string|max:255',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        try {
            $fileUpload = $this->fileUploadService->getFileBySessionId($request->upload_id);
            
            if (!$fileUpload || $fileUpload->status !== 'completed') {
                return response()->json(['message' => 'Upload not completed or not found'], 400);
            }
            
            // Create the document record
            $document = Document::create([
                'user_id' => $request->user()->id,
                'title' => $request->title,
                'description' => $request->description,
                'file_path' => $fileUpload->file_path,
                'file_name' => $fileUpload->original_filename,
                'file_type' => $fileUpload->file_type,
                'file_size' => $fileUpload->file_size,
                'file_hash' => $fileUpload->file_hash,
                'subject' => $request->subject,
                'course_code' => $request->course_code,
                'is_official' => $request->user()->hasRole('lecturer') && $request->has('is_official') ? $request->is_official : false,
                'is_approved' => $request->user()->hasRole(['admin', 'moderator', 'lecturer']) ? true : false,
                'storage_type' => $fileUpload->storage_type,
            ]);
            
            // Broadcast the document upload event
            broadcast(new DocumentUploaded($document))->toOthers();
            
            // Send notification to moderators if document needs approval
            if (!$document->is_approved) {
                $moderators = User::role('moderator')->get();
                foreach ($moderators as $moderator) {
                    $this->notificationService->sendNotification(
                        $moderator->id,
                        'document_pending_approval',
                        "New document '{$document->title}' needs approval",
                        ['document_id' => $document->id]
                    );
                }
            }
            
            return new DocumentResource($document);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
    
    public function handleInterruptedUpload(Request $request, $uploadId)
    {
        try {
            $result = $this->fileUploadService->handleInterruptedUpload($uploadId);
            
            if (!$result) {
                return response()->json(['message' => 'Upload session not found'], 404);
            }
            
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
    
    public function cancelUpload(Request $request, $uploadId)
    {
        try {
            $fileUpload = $this->fileUploadService->getFileBySessionId($uploadId);
            
            if (!$fileUpload) {
                return response()->json(['message' => 'Upload session not found'], 404);
            }
            
            $this->fileUploadService->deleteFileUpload($fileUpload);
            
            return response()->json([
                'message' => 'Upload cancelled successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
    
    public function show(Document $document)
    {
        // Increment view count
        $document->incrementViewCount();
        
        return new DocumentResource($document);
    }
    
    public function update(Request $request, Document $document)
    {
        // Check if user has permission to update this document
        if ($document->user_id !== $request->user()->id && !$request->user()->hasRole(['admin', 'moderator'])) {
            return response()->json(['message' => 'You do not have permission to update this document'], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'subject' => 'nullable|string|max:255',
            'course_code' => 'nullable|string|max:255',
            'is_official' => 'nullable|boolean',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Only lecturers, admins, and moderators can mark documents as official
        if ($request->has('is_official') && !$request->user()->hasRole(['lecturer', 'admin', 'moderator'])) {
            return response()->json(['message' => 'You do not have permission to mark documents as official'], 403);
        }
        
        $document->update([
            'title' => $request->title,
            'description' => $request->description,
            'subject' => $request->subject,
            'course_code' => $request->course_code,
            'is_official' => $request->has('is_official') ? $request->is_official : $document->is_official,
        ]);
        
        return new DocumentResource($document);
    }
    
    public function destroy(Request $request, Document $document)
    {
        // Check if user has permission to delete this document
        if ($document->user_id !== $request->user()->id && !$request->user()->can('delete any document')) {
            return response()->json(['message' => 'You do not have permission to delete this document'], 403);
        }
        
        // Delete the file from storage
        try {
            // Get the file upload record
            $fileUpload = $document->fileUpload;
            
            if ($fileUpload) {
                $this->fileUploadService->deleteFileUpload($fileUpload);
            }
        } catch (\Exception $e) {
            // Log the error but continue with document deletion
            \Log::error('Failed to delete file: ' . $e->getMessage());
        }
        
        $document->delete();
        
        return response()->json(['message' => 'Document deleted successfully']);
    }
    
    public function download(Request $request, Document $document)
    {
        // Increment download count
        $document->incrementDownloadCount();
        
        // Get the file from storage
        try {
            $fileUpload = $document->fileUpload;
            
            if (!$fileUpload) {
                return response()->json(['message' => 'File not found'], 404);
            }
            
            // Xử lý tải xuống dựa trên loại storage
            switch ($fileUpload->storage_type) {
                case 'google_drive':
                    // Google Drive không hỗ trợ tải xuống trực tiếp, trả về lỗi
                    return response()->json(['message' => 'Direct download from Google Drive is not supported. Please use the Google Drive interface.'], 400);
                    
                case 'minio':
                    // Đối với MinIO, trả về URL có thời hạn
                    $url = $this->fileUploadService->getFileUrl($fileUpload);
                    return response()->json([
                        'download_url' => $url,
                        'filename' => $document->file_name,
                    ]);
                    
                default:
                    // Đối với local storage, tải xuống trực tiếp
                    $filePath = storage_path('app/' . $fileUpload->file_path);
                    
                    if (!file_exists($filePath)) {
                        return response()->json(['message' => 'File not found on server'], 404);
                    }
                    
                    return response()->download($filePath, $document->file_name, [
                        'Content-Type' => $document->file_type,
                    ]);
            }
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to download file: ' . $e->getMessage()], 500);
        }
    }
    
    public function approve(Request $request, Document $document)
    {
        if ($document->is_approved) {
            return response()->json(['message' => 'Document is already approved'], 400);
        }
        
        $document->update(['is_approved' => true]);
        
        // Notify the document owner
        $this->notificationService->sendNotification(
            $document->user_id,
            'document_approved',
            "Your document '{$document->title}' has been approved",
            ['document_id' => $document->id]
        );
        
        return new DocumentResource($document);
    }
    
    public function reject(Request $request, Document $document)
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Always update the approval status to false, regardless of current status
        $document->update(['is_approved' => false]);
        
        // Notify the document owner
        $this->notificationService->sendNotification(
            $document->user_id,
            'document_rejected',
            "Your document '{$document->title}' has been rejected",
            [
                'document_id' => $document->id,
                'reason' => $request->reason
            ]
        );
        
        return new DocumentResource($document);
    }
    
    /**
     * Check if a file already exists
     */
    public function checkFileExists(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:102400', // 100MB max
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        try {
            $fileInfo = $this->fileUploadService->checkFileExists($request->file('file'));
            return response()->json($fileInfo);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Get document download information
     * 
     * @param Document $document
     * @return \Illuminate\Http\JsonResponse
     */
    public function getDownloadInfo(Document $document)
    {
        // Check if user has permission to download this document
        if (!$document->is_approved && auth()->id() !== $document->user_id && !auth()->user()->hasRole(['admin', 'moderator'])) {
            return response()->json([
                'message' => 'Bạn không có quyền tải xuống tài liệu này'
            ], 403);
        }
        
        // Increment download count
        $document->incrementDownloadCount();
        
        // Get the file upload record
        $fileUpload = $document->fileUpload;
        
        if (!$fileUpload) {
            return response()->json([
                'message' => 'Không tìm thấy file'
            ], 404);
        }
        
        // Return download information based on storage type
        switch ($fileUpload->storage_type) {
            case 'google_drive':
                // Return download URL for Google Drive files
                if ($fileUpload->google_drive_id) {
                    try {
                        $downloadUrl = $this->fileUploadService->getGoogleDriveDownloadUrl($fileUpload->google_drive_id);
                        return response()->json([
                            'download_url' => $downloadUrl,
                            'filename' => $document->file_name
                        ]);
                    } catch (\Exception $e) {
                        \Log::error('Google Drive download error: ' . $e->getMessage());
                        return response()->json([
                            'message' => 'Không thể tạo đường dẫn tải xuống từ Google Drive'
                        ], 500);
                    }
                }
                break;
                
            case 'minio':
                // Return pre-signed URL for MinIO
                if ($fileUpload->minio_key) {
                    try {
                        $downloadUrl = $this->fileUploadService->getMinioDownloadUrl($fileUpload->minio_key);
                        return response()->json([
                            'download_url' => $downloadUrl,
                            'filename' => $document->file_name
                        ]);
                    } catch (\Exception $e) {
                        \Log::error('MinIO download error: ' . $e->getMessage());
                        return response()->json([
                            'message' => 'Không thể tạo đường dẫn tải xuống từ MinIO'
                        ], 500);
                    }
                }
                break;
                
            default:
                // For local storage, return file info with the API endpoint for secure download
                if (!Storage::exists($fileUpload->file_path)) {
                    return response()->json([
                        'message' => 'Không tìm thấy file trên máy chủ'
                    ], 404);
                }
                
                // Create a token for file access (for direct links)
                $token = null;
                if (auth()->check()) {
                    $token = auth()->user()->createToken('file-access')->plainTextToken;
                }
                
                return response()->json([
                    'filename' => $document->file_name,
                    'file_type' => $document->file_type,
                    'file_size' => $document->file_size,
                    'direct_download' => true,
                    'download_url' => url('/api/storage/download/' . $fileUpload->file_path) . ($token ? '?token=' . $token : ''),
                    'view_url' => url('/api/storage/file/' . $fileUpload->file_path) . ($token ? '?token=' . $token : '')
                ]);
        }
        
        return response()->json([
            'message' => 'Không thể xác định thông tin tải xuống'
        ], 404);
    }
    
    /**
     * Restore a document from trash
     * 
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function restore($id)
    {
        $document = Document::withTrashed()->findOrFail($id);
        
        // Check if user has permission to restore this document
        if ($document->user_id !== auth()->id() && !auth()->user()->can('delete any document')) {
            return response()->json(['message' => 'You do not have permission to restore this document'], 403);
        }
        
        $document->restore();
        
        return response()->json([
            'message' => 'Document restored successfully',
            'document' => new DocumentResource($document)
        ]);
    }
    
    /**
     * Permanently delete a document
     * 
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function forceDelete($id)
    {
        $document = Document::withTrashed()->findOrFail($id);
        
        // Check if user has permission to delete this document
        if ($document->user_id !== auth()->id() && !auth()->user()->can('delete any document')) {
            return response()->json(['message' => 'You do not have permission to permanently delete this document'], 403);
        }
        
        // Delete the file from storage
        try {
            $fileUpload = $document->fileUpload;
            
            if ($fileUpload) {
                $this->fileUploadService->deleteFileUpload($fileUpload);
            }
        } catch (\Exception $e) {
            // Log the error but continue with document deletion
            \Log::error('Failed to delete file: ' . $e->getMessage());
        }
        
        $document->forceDelete();
        
        return response()->json(['message' => 'Document permanently deleted']);
    }
    
    /**
     * Empty the trash (permanently delete all trashed documents)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function emptyTrash(Request $request)
    {
        $userId = auth()->id();
        
        // If user is admin/moderator and has requested to empty all trash
        if ($request->has('all') && $request->all && auth()->user()->hasRole(['admin', 'moderator'])) {
            $documents = Document::onlyTrashed()->get();
        } else {
            // Only get user's own trashed documents
            $documents = Document::onlyTrashed()->where('user_id', $userId)->get();
        }
        
        $count = $documents->count();
        
        foreach ($documents as $document) {
            // Delete the file from storage
            try {
                $fileUpload = $document->fileUpload;
                
                if ($fileUpload) {
                    $this->fileUploadService->deleteFileUpload($fileUpload);
                }
            } catch (\Exception $e) {
                // Log the error but continue with document deletion
                \Log::error('Failed to delete file: ' . $e->getMessage());
            }
            
            $document->forceDelete();
        }
        
        return response()->json([
            'message' => "Successfully emptied trash ($count documents deleted)",
            'count' => $count
        ]);
    }
    
    /**
     * Report a document for inappropriate content
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function report(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|max:500',
            'details' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        // Check if the document exists
        $document = Document::find($id);
        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Tài liệu không tồn tại',
            ], 404);
        }

        // Check if the user has already reported this document and has a pending report
        $existingReport = Report::where('user_id', auth()->id())
            ->where('reportable_type', Document::class)
            ->where('reportable_id', $id)
            ->where('status', 'pending')
            ->first();

        if ($existingReport) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn đã báo cáo tài liệu này và báo cáo đang được xử lý',
            ], 422);
        }

        // Create a new report
        $report = new Report();
        $report->user_id = auth()->id();
        $report->reportable_type = Document::class;
        $report->reportable_id = $id;
        $report->reason = $request->reason;
        $report->details = $request->details;
        $report->status = 'pending';
        $report->save();

        // Notify administrators and moderators about the new report
        try {
            broadcast(new \App\Events\ReportCreated($report))->toOthers();
        } catch (\Exception $e) {
            // Log the error but don't fail the request
            \Log::error('Failed to broadcast report event: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Báo cáo tài liệu đã được gửi thành công',
            'data' => $report,
        ], 201);
    }
}
