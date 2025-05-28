<?php

namespace App\Http\Controllers\API\Report;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class GroupReportController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Submit a report for a group
     */
    public function report(Request $request, $groupId)
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

        // Check if the group exists
        $group = Group::find($groupId);
        if (!$group) {
            return response()->json([
                'success' => false,
                'message' => 'Nhóm không tồn tại',
            ], 404);
        }

        // Check if the user has already reported this group and has a pending report
        $existingReport = Report::where('user_id', auth()->id())
            ->where('reportable_type', Group::class)
            ->where('reportable_id', $groupId)
            ->where('status', 'pending')
            ->first();

        if ($existingReport) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn đã báo cáo nhóm này và báo cáo đang được xử lý',
            ], 422);
        }

        // Create a new report
        $report = new Report();
        $report->user_id = auth()->id();
        $report->reportable_type = Group::class;
        $report->reportable_id = $groupId;
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
            'message' => 'Báo cáo nhóm đã được gửi thành công',
            'data' => $report,
        ], 201);
    }
}
