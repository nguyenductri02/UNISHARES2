<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\API\PaginationController;
use App\Http\Controllers\Controller;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Models\User;
use App\Services\FileUploadService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdminDocumentController extends Controller
{
    protected $fileUploadService;
    protected $notificationService;

    public function __construct(FileUploadService $fileUploadService, NotificationService $notificationService)
    {
        $this->fileUploadService = $fileUploadService;
        $this->notificationService = $notificationService;
        
        // Middleware to ensure only admins and moderators can access these routes
        $this->middleware('auth:sanctum');
        $this->middleware('role:admin|moderator');
    }

    /**
     * Display a listing of all documents for admin management
     *
     * @param Request $request
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
    public function index(Request $request)
    {
        $query = Document::query();
        
        // Apply filters
        if ($request->has('status')) {
            if ($request->status === 'approved') {
                $query->where('is_approved', true);
            } elseif ($request->status === 'pending') {
                $query->where('is_approved', false);
            }
        }
        
        if ($request->has('official')) {
            $query->where('is_official', $request->official == 'true');
        }
        
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('subject')) {
            $query->where('subject', 'like', '%' . $request->subject . '%');
        }

        if ($request->has('course_code')) {
            $query->where('course_code', 'like', '%' . $request->course_code . '%');
        }
        
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                  ->orWhere('description', 'like', '%' . $search . '%')
                  ->orWhere('subject', 'like', '%' . $search . '%')
                  ->orWhere('course_code', 'like', '%' . $search . '%');
            });
        }
        
        // Sort by
        if ($request->has('sort_by')) {
            $sortDirection = $request->has('sort_desc') && $request->sort_desc === 'true' ? 'desc' : 'asc';
            
            switch ($request->sort_by) {
                case 'title':
                    $query->orderBy('title', $sortDirection);
                    break;
                case 'subject':
                    $query->orderBy('subject', $sortDirection);
                    break;
                case 'downloads':
                    $query->orderBy('download_count', $sortDirection);
                    break;
                case 'views':
                    $query->orderBy('view_count', $sortDirection);
                    break;
                case 'created_at':
                    $query->orderBy('created_at', $sortDirection);
                    break;
                default:
                    $query->latest();
                    break;
            }
        } else {
            $query->latest(); // Default sorting by latest
        }
        
        // Eager load user relationship
        $query->with('user');
        
        // Paginate the results
        $documents = PaginationController::paginate($query, $request);
        
        return DocumentResource::collection($documents);
    }

    /**
     * Display the specified document
     *
     * @param Document $document
     * @return DocumentResource
     */
    public function show(Document $document)
    {
        // Load relationships for detailed view
        $document->load(['user', 'ratings', 'comments']);
        
        return new DocumentResource($document);
    }

    /**
     * Update document details
     *
     * @param Request $request
     * @param Document $document
     * @return DocumentResource
     */
    public function update(Request $request, Document $document)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'subject' => 'nullable|string|max:255',
            'course_code' => 'nullable|string|max:255',
            'is_official' => 'nullable|boolean',
            'is_approved' => 'nullable|boolean',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Update document fields that are present in the request
        $document->fill($request->only([
            'title', 'description', 'subject', 'course_code', 'is_official', 'is_approved'
        ]));
        
        $document->save();
        
        // If approval status changed, send notification to document owner
        if ($request->has('is_approved') && $document->wasChanged('is_approved')) {
            $notificationType = $document->is_approved ? 'document_approved' : 'document_rejected';
            $notificationMessage = $document->is_approved 
                ? "Your document '{$document->title}' has been approved by an administrator"
                : "Your document '{$document->title}' has been rejected by an administrator";
            
            // Pass the user ID which will be converted to a User model in the service
            $this->notificationService->sendNotification(
                $document->user_id,
                $notificationType,
                $notificationMessage,
                ['document_id' => $document->id]
            );
        }
        
        return new DocumentResource($document);
    }

    /**
     * Remove the specified document
     *
     * @param Request $request
     * @param Document $document
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Request $request, Document $document)
    {
        $reason = $request->reason ?? 'Document was removed by administrator';
        
        // Delete the file
        try {
            $fileUpload = $document->fileUpload;
            
            if ($fileUpload) {
                $this->fileUploadService->deleteFileUpload($fileUpload);
            }
        } catch (\Exception $e) {
            \Log::error('Failed to delete file: ' . $e->getMessage());
        }
        
        // Send notification to document owner
        $this->notificationService->sendNotification(
            $document->user_id,
            'document_deleted',
            "Your document '{$document->title}' has been deleted by an administrator",
            ['reason' => $reason]
        );
        
        // Delete the document
        $document->delete();
        
        return response()->json([
            'message' => 'Document deleted successfully',
            'success' => true
        ]);
    }

    /**
     * Approve a document
     *
     * @param Document $document
     * @return DocumentResource
     */
    public function approve(Document $document)
    {
        if ($document->is_approved) {
            return response()->json([
                'message' => 'Document is already approved',
                'success' => false
            ], 400);
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

    /**
     * Reject a document
     *
     * @param Request $request
     * @param Document $document
     * @return DocumentResource
     */
    public function reject(Request $request, Document $document)
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|max:500',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Always update to not approved, regardless of current status
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
     * Get document statistics
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function statistics()
    {
        $stats = [
            'total' => Document::count(),
            'approved' => Document::where('is_approved', true)->count(),
            'pending' => Document::where('is_approved', false)->count(),
            'official' => Document::where('is_official', true)->count(),
            'top_subjects' => $this->getTopSubjects(),
            'most_viewed' => $this->getMostViewedDocuments(),
            'most_downloaded' => $this->getMostDownloadedDocuments(),
            'uploads_by_month' => $this->getDocumentsByMonth(),
        ];
        
        return response()->json([
            'data' => $stats,
            'success' => true
        ]);
    }
    
    /**
     * Get top subjects by document count
     *
     * @return array
     */
    private function getTopSubjects()
    {
        return Document::selectRaw('subject, COUNT(*) as count')
            ->whereNotNull('subject')
            ->groupBy('subject')
            ->orderByDesc('count')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'subject' => $item->subject,
                    'count' => $item->count
                ];
            });
    }
    
    /**
     * Get most viewed documents
     *
     * @return array
     */
    private function getMostViewedDocuments()
    {
        return Document::with('user')
            ->orderByDesc('view_count')
            ->limit(5)
            ->get()
            ->map(function ($doc) {
                return [
                    'id' => $doc->id,
                    'title' => $doc->title,
                    'views' => $doc->view_count,
                    'user' => $doc->user ? $doc->user->name : 'Unknown'
                ];
            })
            ->toArray();
    }
    
    /**
     * Get most downloaded documents
     *
     * @return array
     */
    private function getMostDownloadedDocuments()
    {
        return Document::with('user')
            ->orderByDesc('download_count')
            ->limit(5)
            ->get()
            ->map(function ($doc) {
                return [
                    'id' => $doc->id,
                    'title' => $doc->title,
                    'downloads' => $doc->download_count,
                    'user' => $doc->user ? $doc->user->name : 'Unknown'
                ];
            });
    }
    
    /**
     * Get document uploads by month
     *
     * @return array
     */
    private function getDocumentsByMonth()
    {
        $startDate = now()->subMonths(11)->startOfMonth();
        
        $results = Document::selectRaw('COUNT(*) as count, YEAR(created_at) as year, MONTH(created_at) as month')
            ->where('created_at', '>=', $startDate)
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get();
        
        $monthlyData = [];
        
        // Initialize all months with zero count
        for ($i = 0; $i < 12; $i++) {
            $date = now()->subMonths(11 - $i)->startOfMonth();
            $monthlyData[$date->format('Y-m')] = [
                'year' => $date->year,
                'month' => $date->month,
                'month_name' => $date->format('M'),
                'count' => 0
            ];
        }
        
        // Fill in actual counts
        foreach ($results as $result) {
            $key = sprintf('%d-%02d', $result->year, $result->month);
            if (isset($monthlyData[$key])) {
                $monthlyData[$key]['count'] = $result->count;
            }
        }
        
        return array_values($monthlyData);
    }
}
