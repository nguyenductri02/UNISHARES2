<?php

namespace App\Http\Controllers\API\Moderator;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ModeratorStatisticsController extends Controller
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
     * Get overview statistics for moderator dashboard
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function overview()
    {
        try {
            // Document statistics
            $documentStats = [
                'approved' => Document::where('is_approved', true)->count(),
                'pending' => Document::where('is_approved', false)->count(),
                'rejected' => Document::where('is_approved', false)
                    ->whereExists(function ($query) {
                        $query->select(DB::raw(1))
                            ->from('reports')
                            ->whereRaw('reports.reportable_id = documents.id')
                            ->where('reports.reportable_type', Document::class)
                            ->where('reports.status', 'resolved');
                    })
                    ->count(),
                'total' => Document::count()
            ];

            // Report statistics
            $reportStats = [
                'total' => Report::count(),
                'pending' => Report::where('status', 'pending')->count(),
                'resolved' => Report::where('status', 'resolved')->count(),
                'rejected' => Report::where('status', 'rejected')->count()
            ];

            // Recent activities
            $recentActivities = $this->getRecentActivities();

            return response()->json([
                'success' => true,
                'data' => [
                    'documents' => $documentStats,
                    'reports' => $reportStats,
                    'recent_activities' => $recentActivities
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching moderator statistics: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error fetching moderator statistics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get recent activities for the dashboard
     *
     * @return array
     */
    private function getRecentActivities()
    {
        // Get recent document approvals
        $documentApprovals = Document::where('is_approved', true)
            ->orderBy('updated_at', 'desc')
            ->limit(3)
            ->get()
            ->map(function($doc) {
                return [
                    'type' => 'document_approved',
                    'title' => 'Tài liệu được phê duyệt',
                    'description' => 'Tài liệu "' . $doc->title . '" đã được phê duyệt',
                    'timestamp' => $doc->updated_at,
                    'id' => $doc->id
                ];
            });

        // Get recent document rejections (based on reports)
        $documentRejections = Report::where('reportable_type', Document::class)
            ->where('status', 'resolved')
            ->orderBy('resolved_at', 'desc')
            ->limit(3)
            ->get()
            ->map(function($report) {
                $title = 'Không xác định';
                if ($report->reportable) {
                    $title = $report->reportable->title;
                }
                
                return [
                    'type' => 'document_rejected',
                    'title' => 'Tài liệu bị từ chối',
                    'description' => 'Tài liệu "' . $title . '" đã bị từ chối',
                    'timestamp' => $report->resolved_at,
                    'id' => $report->id
                ];
            });

        // Get pending reports
        $pendingReports = Report::where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->limit(3)
            ->get()
            ->map(function($report) {
                $reportType = '';
                $title = 'Không xác định';
                
                if ($report->reportable_type) {
                    $type = class_basename($report->reportable_type);
                    $reportType = strtolower($type);
                }
                
                if ($report->reportable) {
                    $title = $report->reportable->title ?? 
                            ($report->reportable->name ?? 'Không xác định');
                }
                
                return [
                    'type' => 'report_pending',
                    'title' => 'Báo cáo mới',
                    'description' => 'Báo cáo về ' . $reportType . ' "' . $title . '"',
                    'timestamp' => $report->created_at,
                    'id' => $report->id
                ];
            });

        // Get resolved reports
        $resolvedReports = Report::where('status', 'resolved')
            ->orderBy('resolved_at', 'desc')
            ->limit(3)
            ->get()
            ->map(function($report) {
                $reportType = '';
                $title = 'Không xác định';
                
                if ($report->reportable_type) {
                    $type = class_basename($report->reportable_type);
                    $reportType = strtolower($type);
                }
                
                if ($report->reportable) {
                    $title = $report->reportable->title ?? 
                            ($report->reportable->name ?? 'Không xác định');
                }
                
                return [
                    'type' => 'report_resolved',
                    'title' => 'Báo cáo đã xử lý',
                    'description' => 'Báo cáo về ' . $reportType . ' "' . $title . '" đã được xử lý',
                    'timestamp' => $report->resolved_at,
                    'id' => $report->id
                ];
            });

        // Merge all activities and sort by timestamp
        $allActivities = $documentApprovals->concat($documentRejections)
            ->concat($pendingReports)
            ->concat($resolvedReports)
            ->sortByDesc('timestamp')
            ->values()
            ->take(10)
            ->toArray();

        return $allActivities;
    }
}
