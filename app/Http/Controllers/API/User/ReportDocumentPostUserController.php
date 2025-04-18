<?php

namespace App\Http\Controllers\API\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Report;

class ReportDocumentPostUserController extends Controller
{
    /**
     * báo cáo tài liệu bài viết.
     */
    public function store(Request $request)
    {
        $request->validate([
            'reported_user_id' => 'required|exists:users,id',
            'document_id'      => 'required|exists:documents,id',
            'comment_id'       => 'nullable|exists:comments,id',
            'message_id'       => 'nullable|exists:messages,id',
            'reason'           => 'required|string|max:255',
        ]);
        
        $reportedBy = Auth::id(); 
        
        $report = Report::create([
            'reported_by'    => $reportedBy,
            'reported_user'  => $request->reported_user_id,
            'document_id'    => $request->document_id,
            'comment_id'     => $request->comment_id,
            'message_id'     => $request->message_id,
            'reason'         => $request->reason,
            'status_reports' => '1', 
        ]);

        return response()->json(['message' => 'Báo cáo đã được gửi thành công!', 'report' => $report], 201);
    }
}
