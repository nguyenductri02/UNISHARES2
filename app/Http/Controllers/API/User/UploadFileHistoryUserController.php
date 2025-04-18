<?php

namespace App\Http\Controllers\API\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Document;

class UploadFileHistoryUserController extends Controller
{
    //  /**
    //  * lịch sử xóa filefile
    //  */
    public function uploadHistory()
    {
        $userId = Auth::id();

        $documents = Document::where('user_id', $userId)
            ->orderBy('created_at', 'desc') // mới nhất lên đầu
            ->get();

        return response()->json([
            'message' => 'Lịch sử tải lên tài liệu',
            'data' => $documents
        ]);
    }
}
