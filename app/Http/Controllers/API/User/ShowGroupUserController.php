<?php

namespace App\Http\Controllers\API\User;

use App\Models\Group;
use Illuminate\Http\Request;
use App\Http\Controllers\API\BaseController as BaseController;

class ShowGroupUserController extends BaseController
{
    /**
     * hiển thị các group đã có.
     */
    public function index(Request $request)
    {
        $query = Group::query();
        
        if ($request->filled('subject')) {
            $query->where('subject', $request->subject);
        }

        if ($request->filled('university')) {
            $query->where('university', $request->university);
        }

        $groups = $query->with('creator')->get(); 

        return response()->json([
            'message' => 'Danh sách nhóm học tập',
            'data' => $groups
        ]);
    }
}
