<?php

namespace App\Http\Controllers\API\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Document;

class MyDocumentUserController extends Controller
{
    //  /**
    //  * hiển thị những file đã đăng tải.
    //  */
    public function myDocuments()
    {
        $userId = Auth::id();

        $documents = Document::where('user_id', $userId)->get();

        return response()->json([
            'message' => 'Danh sách tài liệu bạn đã tải lên',
            'data' => $documents
        ]);
    }
}
