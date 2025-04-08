<?php

namespace App\Http\Controllers\Api;


use Illuminate\Http\Request;
use App\Models\Document;
use App\Models\Group;
use App\Http\Controllers\API\BaseController as BaseController;

class DemoController extends BaseController
{
    public function searchDocuments(Request $request)
    {
        $keyword = $request->input('keyword');

        if (!$keyword) {
            return response()->json(['status' => false, 'message' => 'Keyword is required'], 400);
        }

        $documents = Document::where('title', 'like', "%$keyword%")
            ->orWhere('subject', 'like', "%$keyword%")
            ->orWhere('university', 'like', "%$keyword%")
            ->orWhere('description', 'like', "%$keyword%")
            ->get();

        return response()->json([
            'status' => true,
            'message' => 'Kết quả tìm kiếm tài liệu',
            'data' => $documents
        ]);
    }

    public function searchGroups(Request $request)
    {
        $keyword = $request->input('keyword');

        if (!$keyword) {
            return response()->json(['status' => false, 'message' => 'Keyword is required'], 400);
        }

        $groups = Group::where('name', 'like', "%$keyword%")
            ->orWhere('description', 'like', "%$keyword%")
            ->orWhere('university', 'like', "%$keyword%")
            ->get();

        return response()->json([
            'status' => true,
            'message' => 'Kết quả tìm kiếm nhóm',
            'data' => $groups
        ]);
    }

    
}
