<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Group;
use App\Models\Post;
use App\Models\User;
use App\Models\Chat;
use App\Models\Message;
use App\Models\Report;
use App\Models\FileUpload;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class StatisticsController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Lấy thống kê tổng quan
     */
    public function overview()
    {
        $totalUsers = User::count();
        $activeUsers = User::where('is_active', true)->count();
        $totalDocuments = Document::count();
        $approvedDocuments = Document::where('is_approved', true)->count();
        $pendingDocuments = Document::where('is_approved', false)->count();
        $totalPosts = Post::count();
        $totalGroups = Group::count();
        $totalMessages = 0; // Messages::count();
        $pendingReports = Report::where('status', 'pending')->count();
        
        // Handle the storage calculation safely
        $totalStorage = 0;
        try {
            if (Schema::hasTable('file_uploads') && Schema::hasColumn('file_uploads', 'size')) {
                $totalStorage = FileUpload::sum('size');
            }
        } catch (\Exception $e) {
            // If error, just keep total at 0
            \Log::error('Error calculating storage: ' . $e->getMessage());
        }
        
        // Người dùng mới trong 7 ngày qua
        $newUsers = User::where('created_at', '>=', Carbon::now()->subDays(7))->count();
        
        // Tài liệu mới trong 7 ngày qua
        $newDocuments = Document::where('created_at', '>=', Carbon::now()->subDays(7))->count();
        
        // Bài đăng mới trong 7 ngày qua
        $newPosts = Post::where('created_at', '>=', Carbon::now()->subDays(7))->count();
        
        return response()->json([
            'users' => [
                'total' => $totalUsers,
                'active' => $activeUsers,
                'new_7_days' => $newUsers
            ],
            'content' => [
                'documents' => [
                    'total' => $totalDocuments,
                    'approved' => $approvedDocuments,
                    'pending' => $pendingDocuments,
                    'new_7_days' => $newDocuments
                ],
                'posts' => [
                    'total' => $totalPosts,
                    'new_7_days' => $newPosts
                ]
            ],
            'groups' => [
                'total' => $totalGroups
            ],
            'reports' => [
                'pending' => $pendingReports,
                'total' => Report::count()
            ],
            'messages' => [
                'total' => $totalMessages
            ],
            'storage' => [
                'total_bytes' => $totalStorage,
                'formatted' => $this->formatBytes($totalStorage)
            ]
        ]);
    }

    /**
     * Lấy thống kê người dùng
     */
    public function users(Request $request)
    {
        $period = $request->input('period', 'month');
        $startDate = $this->getStartDate($period);
        
        // Thống kê người dùng theo vai trò
        $usersByRole = User::select('role', DB::raw('count(*) as count'))
            ->groupBy('role')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->role ?? 'student' => $item->count];
            })
            ->toArray();
        
        // Ensure all role keys exist
        $roles = ['student', 'lecturer', 'moderator', 'admin'];
        foreach ($roles as $role) {
            if (!isset($usersByRole[$role])) {
                $usersByRole[$role] = 0;
            }
        }
        
        // Thống kê người dùng mới theo thời gian
        $newUsers = User::where('created_at', '>=', Carbon::now()->subDays(30))->count();
        
        // Thống kê người dùng hoạt động
        $activeUsers = User::where('last_login_at', '>=', Carbon::now()->subDays(30))->count();
        
        // Số lượng người dùng không hoạt động
        $inactiveUsers = User::where(function($query) {
            $query->whereNull('last_login_at')
                ->orWhere('last_login_at', '<', Carbon::now()->subDays(30));
        })->count();
        
        // Tổng số người dùng
        $totalUsers = User::count();
        
        return response()->json([
            'total' => $totalUsers,
            'active' => $activeUsers,
            'inactive' => $inactiveUsers,
            'newUsers' => $newUsers,
            'usersByRole' => $usersByRole
        ]);
    }

    /**
     * Lấy thống kê tài liệu
     */
    public function documents(Request $request)
    {
        $period = $request->input('period', 'month');
        $startDate = $this->getStartDate($period);
        
        // Thống kê tài liệu theo môn học
        $documentsBySubject = Document::selectRaw('subject, COUNT(*) as count')
            ->whereNotNull('subject')
            ->groupBy('subject')
            ->orderByDesc('count')
            ->limit(5)
            ->get();
        
        // Thống kê tài liệu mới theo thời gian
        $newDocuments = Document::where('created_at', '>=', Carbon::now()->subDays(30))->count();
        
        // Thống kê tài liệu theo trạng thái
        $approved = Document::where('is_approved', true)->count();
        $pending = Document::where('is_approved', false)->count();
        $official = Document::where('is_official', true)->count();
        
        // Thống kê tài liệu theo người tạo
        $topContributors = Document::select('user_id', DB::raw('count(*) as count'))
            ->with('user:id,name')
            ->groupBy('user_id')
            ->orderByDesc('count')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'user_id' => $item->user_id,
                    'name' => $item->user ? $item->user->name : 'Unknown',
                    'count' => $item->count
                ];
            });
        
        return response()->json([
            'total' => Document::count(),
            'approved' => $approved,
            'pending' => $pending,
            'official' => $official,
            'new_30_days' => $newDocuments,
            'top_subjects' => $documentsBySubject,
            'top_contributors' => $topContributors
        ]);
    }

    /**
     * Lấy thống kê nhóm
     */
    public function groups()
    {
        // Thống kê nhóm theo loại
        $courseGroups = Group::where('type', 'course')->count();
        $publicGroups = Group::where('type', 'public')->count();
        $privateGroups = Group::where('is_private', true)->count();
        
        // Nhóm lớn nhất
        $largestGroups = Group::withCount('members')
            ->orderByDesc('members_count')
            ->limit(5)
            ->get()
            ->map(function ($group) {
                return [
                    'id' => $group->id,
                    'name' => $group->name,
                    'member_count' => $group->members_count
                ];
            });
        
        return response()->json([
            'total' => Group::count(),
            'course_groups' => $courseGroups,
            'public_groups' => $publicGroups,
            'private_groups' => $privateGroups,
            'largest_groups' => $largestGroups
        ]);
    }

    /**
     * Lấy thống kê báo cáo
     */
    public function reports()
    {
        // Thống kê báo cáo theo loại
        $reportsByType = Report::selectRaw('reportable_type, COUNT(*) as count')
            ->groupBy('reportable_type')
            ->get()
            ->mapWithKeys(function ($item) {
                $type = class_basename($item->reportable_type);
                return [$type => $item->count];
            });
        
        // Thống kê báo cáo theo trạng thái
        $reportsByStatus = Report::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->status => $item->count];
            });
        
        // Báo cáo mới nhất
        $latestReports = Report::with(['reporter:id,name', 'reportable'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(function ($report) {
                return [
                    'id' => $report->id,
                    'reason' => $report->reason,
                    'status' => $report->status,
                    'reporter' => $report->reporter ? $report->reporter->name : 'Unknown',
                    'reportable_type' => class_basename($report->reportable_type),
                    'reportable_id' => $report->reportable_id,
                    'created_at' => $report->created_at->format('Y-m-d H:i:s')
                ];
            });
        
        return response()->json([
            'total' => Report::count(),
            'pending' => Report::where('status', 'pending')->count(),
            'resolved' => Report::where('status', 'resolved')->count(),
            'rejected' => Report::where('status', 'rejected')->count(),
            'by_type' => $reportsByType,
            'by_status' => $reportsByStatus,
            'latest' => $latestReports
        ]);
    }

    /**
     * Get the start date based on the period
     */
    private function getStartDate($period)
    {
        switch ($period) {
            case 'week':
                return Carbon::now()->subWeek();
            case 'month':
                return Carbon::now()->subMonth();
            case 'quarter':
                return Carbon::now()->subMonths(3);
            case 'year':
                return Carbon::now()->subYear();
            default:
                return Carbon::now()->subMonth();
        }
    }

    /**
     * Format bytes to human readable format
     */
    private function formatBytes($bytes, $precision = 2)
    {
        if ($bytes <= 0) {
            return '0 Bytes';
        }
        
        $units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        
        $bytes /= (1 << (10 * $pow));
        
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}
