<?php

namespace App\Http\Controllers\API\User;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Document;
use App\Http\Resources\UserActivityResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserHistoryController extends Controller
{
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }
    
    /**
     * Display a listing of the user's history/activity.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $userId = auth()->id();
        $perPage = $request->input('per_page', 15);
        $page = $request->input('page', 1);
        $type = $request->input('type');
        $action = $request->input('action');
        
        // Base query for document activities
        $documentsQuery = Document::where('user_id', $userId)
            ->select(
                'id', 
                'title', 
                'file_name', 
                'file_type', 
                'file_hash',
                'created_at',
                DB::raw("'document' as type"),
                DB::raw("'upload' as action")
            );
            
        // Apply type filter if provided
        if ($type) {
            $documentsQuery->where(function($query) use ($type) {
                if ($type === 'document') {
                    $query->whereNotNull('id'); // All documents match
                }
            });
        }
        
        // Apply action filter if provided
        if ($action) {
            $documentsQuery->where(function($query) use ($action) {
                if ($action === 'upload') {
                    $query->whereNotNull('created_at'); // All documents have created_at
                }
            });
        }
        
        // Execute the query with pagination
        $history = $documentsQuery->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);
        
        return response()->json([
            'data' => $history->items(),
            'meta' => [
                'current_page' => $history->currentPage(),
                'from' => $history->firstItem(),
                'last_page' => $history->lastPage(),
                'per_page' => $history->perPage(),
                'to' => $history->lastItem(),
                'total' => $history->total(),
            ]
        ]);
    }
}
