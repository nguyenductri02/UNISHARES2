<?php

namespace App\Http\Controllers\API\Moderator;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ModeratorDocumentController extends Controller
{
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:moderator,admin');
    }

    /**
     * Display a listing of documents with filtering.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 10);
            $sortBy = $request->input('sort_by', 'created_at');
            $sortDesc = $request->input('sort_desc', true);
            $search = $request->input('search', '');
            $status = $request->input('status', 'all');
            
            $query = Document::with(['user']);
            
            // Apply search if provided
            if (!empty($search)) {
                $query->where(function($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhere('keywords', 'like', "%{$search}%")
                      ->orWhere('course_code', 'like', "%{$search}%")
                      ->orWhere('subject', 'like', "%{$search}%");
                });
            }
            
            // Apply status filter
            if ($status !== 'all') {
                $isApproved = ($status === 'approved');
                $query->where('is_approved', $isApproved);
            }
            
            // Apply sorting
            $query->orderBy($sortBy, $sortDesc ? 'desc' : 'asc');
            
            // Get paginated results
            $documents = $query->paginate($perPage);
            
            return response()->json($documents);
        } catch (\Exception $e) {
            \Log::error('Error fetching documents for moderator: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Error fetching documents: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get documents pending approval
     * 
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function pendingApproval(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 10);
            
            $documents = Document::with(['user'])
                ->where('is_approved', false)
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);
                
            return response()->json($documents);
        } catch (\Exception $e) {
            \Log::error('Error fetching pending documents: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Error fetching pending documents: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Approve a document
     * 
     * @param Document $document
     * @return \Illuminate\Http\Response
     */
    public function approve(Document $document)
    {
        try {
            if ($document->is_approved) {
                return response()->json([
                    'message' => 'Document is already approved'
                ], 400);
            }
            
            $document->is_approved = true;
            $document->approved_by = Auth::id();
            $document->approved_at = now();
            $document->save();
            
            // Notify the document owner
            if ($document->user) {
                // Implement notification if needed
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Document approved successfully',
                'document' => $document
            ]);
        } catch (\Exception $e) {
            \Log::error('Error approving document: ' . $e->getMessage(), [
                'exception' => $e,
                'document_id' => $document->id,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Error approving document: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Reject a document
     * 
     * @param Request $request
     * @param Document $document
     * @return \Illuminate\Http\Response
     */
    public function reject(Request $request, Document $document)
    {
        try {
            $validator = Validator::make($request->all(), [
                'reason' => 'required|string|max:500'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            if ($document->is_approved) {
                $document->is_approved = false;
            }
            
            $document->rejected_by = Auth::id();
            $document->rejected_at = now();
            $document->rejection_reason = $request->reason;
            $document->save();
            
            // Notify the document owner
            if ($document->user) {
                // Implement notification if needed
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Document rejected successfully',
                'document' => $document
            ]);
        } catch (\Exception $e) {
            \Log::error('Error rejecting document: ' . $e->getMessage(), [
                'exception' => $e,
                'document_id' => $document->id,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Error rejecting document: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Delete a document
     * 
     * @param Document $document
     * @return \Illuminate\Http\Response
     */
    public function delete(Document $document)
    {
        try {
            // Store document info for logging
            $documentInfo = [
                'id' => $document->id,
                'title' => $document->title,
                'user_id' => $document->user_id
            ];
            
            // Delete file from storage if exists
            if ($document->file_path && Storage::exists($document->file_path)) {
                Storage::delete($document->file_path);
            }
            
            // Delete document record
            $document->delete();
            
            // Log the deletion
            \Log::info('Document deleted by moderator', [
                'moderator_id' => Auth::id(),
                'document' => $documentInfo
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Document deleted successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Error deleting document: ' . $e->getMessage(), [
                'exception' => $e,
                'document_id' => $document->id,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Error deleting document: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get reports for a document
     * 
     * @return \Illuminate\Http\Response
     */
    public function reports()
    {
        try {
            $reports = Report::with(['user', 'reportable'])
                ->whereHasMorph('reportable', [Document::class])
                ->orderBy('created_at', 'desc')
                ->paginate(10);
                
            return response()->json($reports);
        } catch (\Exception $e) {
            \Log::error('Error fetching document reports: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Error fetching document reports: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Resolve a report
     * 
     * @param Report $report
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function resolveReport(Report $report, Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'resolution' => 'required|string|max:500'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $report->status = 'resolved';
            $report->resolved_by = Auth::id();
            $report->resolution_note = $request->resolution;
            $report->resolved_at = now();
            $report->save();
            
            return response()->json([
                'success' => true,
                'message' => 'Report resolved successfully',
                'report' => $report
            ]);
        } catch (\Exception $e) {
            \Log::error('Error resolving report: ' . $e->getMessage(), [
                'exception' => $e,
                'report_id' => $report->id,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Error resolving report: ' . $e->getMessage()
            ], 500);
        }
    }
}
