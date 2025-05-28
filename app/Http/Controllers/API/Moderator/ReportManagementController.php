<?php

namespace App\Http\Controllers\API\Moderator;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\Document;
use App\Models\Post;
use App\Models\Comment;
use App\Models\User;
use App\Models\Group;
use App\Events\ReportResolved;
use App\Notifications\ReportResolved as ReportResolvedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class ReportManagementController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:moderator,admin');
    }

    /**
     * Lấy danh sách báo cáo
     */
    public function index(Request $request)
    {
        try {
            // Debug: Log request to verify parameters
            \Log::info('Report fetch request params:', $request->all());

            // Build query from base model without filters first
            $query = Report::query();
            
            // Debug: Count total reports before filtering
            \Log::info('Total reports in database: ' . Report::count());
            
            // Lọc theo trạng thái - only apply if not 'all'
            if ($request->has('status') && $request->status !== 'all' && !empty($request->status)) {
                $query->where('status', $request->status);
                \Log::info('Filtering by status: ' . $request->status);
            }
            
            // Lọc theo loại - only apply if not 'all'
            if ($request->has('type') && $request->type !== 'all' && !empty($request->type)) {
                $reportableType = $this->getReportableModel($request->type);
                if ($reportableType) {
                    $query->where('reportable_type', $reportableType);
                    \Log::info('Filtering by reportable_type: ' . $reportableType);
                }
            }
            
            // Tìm kiếm - only apply if not empty
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('reason', 'like', "%{$search}%")
                    ->orWhere('details', 'like', "%{$search}%");
                });
                \Log::info('Filtering by search term: ' . $search);
            }
            
            // Debug: Count results after filtering but before eager loading
            $countAfterFiltering = $query->count();
            \Log::info('Count after filtering: ' . $countAfterFiltering);
            
            // Eager load user relationship and reportable - critical for getting report content
            $query->with(['user', 'reportable']);
            
            // Sắp xếp
            $sortBy = $request->input('sort_by', 'created_at');
            $sortOrder = $request->input('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);
            \Log::info("Sorting by {$sortBy} {$sortOrder}");
            
            // Phân trang
            $perPage = $request->input('per_page', 15);
            $reports = $query->paginate($perPage);
            
            // Debug: Check reports returned
            \Log::info('Reports returned count: ' . count($reports));
            \Log::info('First report ID: ' . ($reports->count() > 0 ? $reports[0]->id : 'none'));
            
            // Ensure we have reportable data
            $reportsWithDetails = $reports->through(function($report) {
                $report->reportable_details = $this->getReportableInfo($report->reportable);
                return $report;
            });
            
            // Return the standard paginator object
            return response()->json($reportsWithDetails);
        } catch (\Exception $e) {
            \Log::error('Error fetching reports: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error fetching reports: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * Lấy tất cả báo cáo không lọc
     */
    public function getAllReports(Request $request)
    {
        try {
            // Build query from base model without any filters
            $query = Report::query();
            
            // Debug: Log request
            \Log::info('Get all reports request');
            
            // Eager load user relationship
            $query->with(['user', 'reportable']);
            
            // Sort by created_at desc by default
            $sortBy = $request->input('sort_by', 'created_at');
            $sortOrder = $request->input('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);
            
            // Pagination
            $perPage = $request->input('per_page', 15);
            $reports = $query->paginate($perPage);
            
            // Debug: Check reports returned
            \Log::info('All reports returned count: ' . count($reports));
            
            return response()->json([
                'success' => true,
                'data' => $reports
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching all reports: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error fetching all reports: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * Lấy chi tiết báo cáo
     */
    public function show($id)
    {
        try {
            $report = Report::with(['user', 'reportable', 'resolver'])->findOrFail($id);
            
            // Make sure reportable relationship is loaded
            if (!$report->relationLoaded('reportable') && $report->reportable_type && $report->reportable_id) {
                try {
                    $reportableType = $report->reportable_type;
                    $reportableId = $report->reportable_id;
                    $reportable = $reportableType::find($reportableId);
                    $report->setRelation('reportable', $reportable);
                } catch (\Exception $e) {
                    \Log::warning("Could not load reportable for report {$id}: " . $e->getMessage());
                }
            }
            
            // Lấy thông tin bổ sung về đối tượng báo cáo
            $reportableInfo = $this->getReportableInfo($report->reportable);
            
            // Debug log
            \Log::info('Report details for ID ' . $id . ':', [
                'report_id' => $report->id,
                'has_reportable' => $report->reportable ? 'yes' : 'no',
                'reportable_info' => $reportableInfo
            ]);
            
            // Make sure to create a serializable response
            $responseData = [
                'report' => $report,
                'reportable_info' => $reportableInfo,
            ];
            
            return response()->json([
                'success' => true,
                'data' => $responseData,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching report details: ' . $e->getMessage(), [
                'exception' => $e,
                'report_id' => $id
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error fetching report details: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Xử lý báo cáo
     */
    public function resolve(Request $request, $id)
    {
        try {
            $report = Report::findOrFail($id);
            
            // Kiểm tra xem báo cáo đã được xử lý chưa
            if ($report->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Báo cáo này đã được xử lý',
                ], 422);
            }
            
            $validator = Validator::make($request->all(), [
                'action' => 'required|string|in:resolve,reject,delete,ban',
                'resolution_note' => 'required|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Xử lý báo cáo dựa trên hành động
            switch ($request->action) {
                case 'resolve':
                    // Đánh dấu báo cáo là đã xử lý
                    $report->status = 'resolved';
                    $report->resolved_by = auth()->id();
                    $report->resolution_note = $request->resolution_note;
                    $report->resolved_at = now();
                    $report->save();
                    break;
                    
                case 'reject':
                    // Từ chối báo cáo
                    $report->status = 'rejected';
                    $report->resolved_by = auth()->id();
                    $report->resolution_note = $request->resolution_note;
                    $report->resolved_at = now();
                    $report->save();
                    break;
                    
                case 'delete':
                    // Xóa đối tượng báo cáo
                    $reportable = $report->reportable;
                    
                    if ($reportable) {
                        // Xóa đối tượng báo cáo
                        $reportable->delete();
                        
                        // Đánh dấu tất cả các báo cáo liên quan là đã xử lý
                        Report::where('reportable_type', get_class($reportable))
                            ->where('reportable_id', $reportable->id)
                            ->where('status', 'pending')
                            ->update([
                                'status' => 'resolved',
                                'resolved_by' => auth()->id(),
                                'resolution_note' => $request->resolution_note,
                                'resolved_at' => now(),
                            ]);
                    } else {
                        // Đối tượng báo cáo không tồn tại
                        $report->status = 'resolved';
                        $report->resolved_by = auth()->id();
                        $report->resolution_note = $request->resolution_note . ' (Đối tượng không tồn tại)';
                        $report->resolved_at = now();
                        $report->save();
                    }
                    break;
                    
                case 'ban':
                    // Cấm người dùng (chỉ áp dụng cho báo cáo người dùng)
                    if ($report->reportable_type === User::class) {
                        $user = $report->reportable;
                        
                        if ($user) {
                            // Cấm người dùng
                            $user->is_active = false;
                            $user->ban_reason = $request->resolution_note;
                            $user->banned_at = now();
                            $user->save();
                            
                            // Thu hồi tất cả token
                            $user->tokens()->delete();
                            
                            // Đánh dấu tất cả các báo cáo liên quan là đã xử lý
                            Report::where('reportable_type', User::class)
                                ->where('reportable_id', $user->id)
                                ->where('status', 'pending')
                                ->update([
                                    'status' => 'resolved',
                                    'resolved_by' => auth()->id(),
                                    'resolution_note' => $request->resolution_note,
                                    'resolved_at' => now(),
                                ]);
                        }
                    } else {
                        return response()->json([
                            'success' => false,
                            'message' => 'Hành động cấm chỉ áp dụng cho báo cáo người dùng',
                        ], 422);
                    }
                    break;
            }
            
            // Gửi thông báo cho người báo cáo
            $reporter = $report->user;
            if ($reporter) {
                $reporter->notify(new ReportResolvedNotification($report));
            }
            
            // Gửi sự kiện báo cáo đã được xử lý
            try {
                broadcast(new ReportResolved($report))->toOthers();
            } catch (\Exception $e) {
                // Log the broadcasting error but continue
                Log::warning('Failed to broadcast report resolved event: ' . $e->getMessage());
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Báo cáo đã được xử lý thành công',
                'data' => $report,
            ]);
        } catch (\Exception $e) {
            Log::error('Error resolving report: ' . $e->getMessage(), [
                'exception' => $e,
                'report_id' => $id,
                'action' => $request->action ?? 'unknown'
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error resolving report: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Xử lý nhiều báo cáo cùng lúc
     */
    public function bulkResolve(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'report_ids' => 'required|array',
                'report_ids.*' => 'required|integer|exists:reports,id',
                'action' => 'required|string|in:resolve,reject',
                'resolution_note' => 'required|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $reportIds = $request->report_ids;
            $action = $request->action;
            $resolutionNote = $request->resolution_note;
            
            // Chỉ xử lý các báo cáo đang chờ xử lý
            $reports = Report::whereIn('id', $reportIds)
                ->where('status', 'pending')
                ->get();
                
            if ($reports->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không có báo cáo nào cần được xử lý',
                ], 422);
            }
            
            $count = 0;
            $status = $action === 'resolve' ? 'resolved' : 'rejected';
            
            foreach ($reports as $report) {
                $report->status = $status;
                $report->resolved_by = auth()->id();
                $report->resolution_note = $resolutionNote;
                $report->resolved_at = now();
                $report->save();
                
                // Gửi thông báo cho người báo cáo
                if ($report->user) {
                    $report->user->notify(new ReportResolvedNotification($report));
                }
                
                $count++;
            }
            
            return response()->json([
                'success' => true,
                'message' => "{$count} báo cáo đã được xử lý thành công",
                'count' => $count
            ]);
        } catch (\Exception $e) {
            Log::error('Error in bulk resolve reports: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi xử lý hàng loạt báo cáo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy thống kê báo cáo
     */
    public function statistics()
    {
        try {
            // Tổng số báo cáo
            $totalReports = Report::count();
            
            // Báo cáo theo trạng thái
            $reportsByStatus = Report::select('status', \DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get()
                ->pluck('count', 'status')
                ->toArray();
            
            // Báo cáo theo loại
            $reportsByType = Report::select('reportable_type', \DB::raw('count(*) as count'))
                ->groupBy('reportable_type')
                ->get()
                ->map(function ($item) {
                    $type = class_basename($item->reportable_type);
                    return [
                        'type' => $type,
                        'count' => $item->count,
                    ];
                });
            
            // Báo cáo mới trong 7 ngày qua
            $newReports = Report::where('created_at', '>=', \Carbon\Carbon::now()->subDays(7))->count();
            
            // Báo cáo được xử lý nhanh nhất và chậm nhất (để đánh giá hiệu suất xử lý)
            $fastestResolution = Report::whereNotNull('resolved_at')
                ->select(\DB::raw('TIMESTAMPDIFF(MINUTE, created_at, resolved_at) as resolution_time'))
                ->orderBy('resolution_time', 'asc')
                ->first();
                
            $slowestResolution = Report::whereNotNull('resolved_at')
                ->select(\DB::raw('TIMESTAMPDIFF(MINUTE, created_at, resolved_at) as resolution_time'))
                ->orderBy('resolution_time', 'desc')
                ->first();
                
            // Thời gian xử lý trung bình (phút)
            $avgResolutionTime = Report::whereNotNull('resolved_at')
                ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, created_at, resolved_at)) as avg_time')
                ->first();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $totalReports,
                    'by_status' => $reportsByStatus,
                    'by_type' => $reportsByType,
                    'new_reports' => $newReports,
                    'resolution_metrics' => [
                        'fastest' => $fastestResolution ? round($fastestResolution->resolution_time, 2) : null,
                        'slowest' => $slowestResolution ? round($slowestResolution->resolution_time, 2) : null,
                        'average' => $avgResolutionTime ? round($avgResolutionTime->avg_time, 2) : null,
                    ]
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching report statistics: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error fetching report statistics: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * Fix for route conflict: handle /reports/statistics correctly
     * This method is needed because Laravel is confusing /reports/statistics with /reports/{id}
     */
    public function getStatistics()
    {
        try {
            // Reuse same logic as the statistics method
            // Tổng số báo cáo
            $totalReports = Report::count();
            
            // Báo cáo theo trạng thái
            $reportsByStatus = Report::select('status', \DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get()
                ->pluck('count', 'status')
                ->toArray();
            
            // Báo cáo theo loại
            $reportsByType = Report::select('reportable_type', \DB::raw('count(*) as count'))
                ->groupBy('reportable_type')
                ->get()
                ->map(function ($item) {
                    $type = class_basename($item->reportable_type);
                    return [
                        'type' => $type,
                        'count' => $item->count,
                    ];
                });
            
            // Báo cáo mới trong 7 ngày qua
            $newReports = Report::where('created_at', '>=', \Carbon\Carbon::now()->subDays(7))->count();
            
            // Báo cáo được xử lý nhanh nhất và chậm nhất (để đánh giá hiệu suất xử lý)
            $fastestResolution = Report::whereNotNull('resolved_at')
                ->select(\DB::raw('TIMESTAMPDIFF(MINUTE, created_at, resolved_at) as resolution_time'))
                ->orderBy('resolution_time', 'asc')
                ->first();
                
            $slowestResolution = Report::whereNotNull('resolved_at')
                ->select(\DB::raw('TIMESTAMPDIFF(MINUTE, created_at, resolved_at) as resolution_time'))
                ->orderBy('resolution_time', 'desc')
                ->first();
                
            // Thời gian xử lý trung bình (phút)
            $avgResolutionTime = Report::whereNotNull('resolved_at')
                ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, created_at, resolved_at)) as avg_time')
                ->first();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $totalReports,
                    'by_status' => $reportsByStatus,
                    'by_type' => $reportsByType,
                    'new_reports' => $newReports,
                    'resolution_metrics' => [
                        'fastest' => $fastestResolution ? round($fastestResolution->resolution_time, 2) : null,
                        'slowest' => $slowestResolution ? round($slowestResolution->resolution_time, 2) : null,
                        'average' => $avgResolutionTime ? round($avgResolutionTime->avg_time, 2) : null,
                    ]
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in getStatistics method: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error fetching statistics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy model tương ứng với loại báo cáo
     */
    private function getReportableModel($type)
    {
        switch ($type) {
            case 'document':
                return Document::class;
            case 'post':
                return Post::class;
            case 'comment':
                return Comment::class;
            case 'user':
                return User::class;
            case 'group':
                return Group::class;
            default:
                return null;
        }
    }

    /**
     * Lấy thông tin bổ sung về đối tượng báo cáo
     */
    private function getReportableInfo($reportable)
    {
        if (!$reportable) {
            return [
                'type' => 'unknown',
                'title' => 'Đối tượng không tồn tại',
                'details' => 'Đối tượng báo cáo đã bị xóa hoặc không tồn tại',
            ];
        }
        
        $type = class_basename(get_class($reportable));
        
        switch ($type) {
            case 'Document':
                return [
                    'type' => 'document',
                    'title' => $reportable->title,
                    'details' => $reportable->description,
                    'user' => $reportable->user ? $reportable->user->name : 'Người dùng đã xóa',
                    'created_at' => $reportable->created_at->format('Y-m-d H:i:s'),
                    'url' => "/documents/{$reportable->id}",
                    'additional_data' => [
                        'views' => $reportable->view_count,
                        'downloads' => $reportable->download_count,
                        'file_type' => $reportable->file_type,
                        'file_size' => $reportable->file_size,
                    ]
                ];
                
            case 'Post':
                return [
                    'type' => 'post',
                    'title' => $reportable->title,
                    'details' => $reportable->content,
                    'user' => $reportable->user ? $reportable->user->name : 'Người dùng đã xóa',
                    'created_at' => $reportable->created_at->format('Y-m-d H:i:s'),
                    'url' => "/posts/{$reportable->id}",
                    'additional_data' => [
                        'group' => $reportable->group ? $reportable->group->name : null,
                        'likes' => $reportable->likes_count,
                        'comments' => $reportable->comments_count,
                    ]
                ];
                
            case 'Comment':
                return [
                    'type' => 'comment',
                    'title' => 'Bình luận',
                    'details' => $reportable->content,
                    'user' => $reportable->user ? $reportable->user->name : 'Người dùng đã xóa',
                    'created_at' => $reportable->created_at->format('Y-m-d H:i:s'),
                    'url' => "/posts/{$reportable->post_id}#comment-{$reportable->id}",
                    'additional_data' => [
                        'post_title' => $reportable->post ? $reportable->post->title : 'Bài đăng không còn tồn tại',
                        'likes' => $reportable->likes_count ?? 0,
                    ]
                ];
                
            case 'User':
                return [
                    'type' => 'user',
                    'title' => $reportable->name,
                    'details' => "Email: {$reportable->email}, Vai trò: " . implode(', ', $this->getUserRoles($reportable)),
                    'created_at' => $reportable->created_at->format('Y-m-d H:i:s'),
                    'url' => "/users/{$reportable->id}",
                    'additional_data' => [
                        'posts_count' => $reportable->posts_count ?? 0,
                        'documents_count' => $reportable->documents_count ?? 0,
                        'account_status' => $reportable->is_active ? 'active' : 'inactive',
                    ]
                ];
                
            case 'Group':
                return [
                    'type' => 'group',
                    'title' => $reportable->name,
                    'details' => $reportable->description,
                    'user' => $reportable->creator ? $reportable->creator->name : 'Người dùng đã xóa',
                    'created_at' => $reportable->created_at->format('Y-m-d H:i:s'),
                    'url' => "/groups/{$reportable->id}",
                    'additional_data' => [
                        'members_count' => $reportable->member_count,
                        'type' => $reportable->type,
                        'course_code' => $reportable->course_code,
                    ]
                ];
                
            default:
                return [
                    'type' => 'unknown',
                    'title' => 'Loại không xác định',
                    'details' => 'Không thể hiển thị thông tin chi tiết',
                ];
        }
    }

    /**
     * Lấy danh sách vai trò của người dùng
     */
    private function getUserRoles($user)
    {
        if (!$user || !$user->roles) {
            return ['unknown'];
        }
        
        if (is_array($user->roles)) {
            return array_map(function($role) {
                return is_string($role) ? $role : ($role->name ?? 'unknown');
            }, $user->roles);
        }
        
        return [$user->roles];
    }
}
