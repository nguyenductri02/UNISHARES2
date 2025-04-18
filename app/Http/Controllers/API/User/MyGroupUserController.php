<?php

namespace App\Http\Controllers\API\User;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Group;
use App\Models\GroupMember;
use App\Http\Controllers\API\BaseController as BaseController;

class MyGroupUserController extends BaseController
{
    //  /**
    //  * hiển thị những group đã tham gia.
    //  */
    public function myGroups()
    {
        $userId = Auth::id();
        
        $groupIds = GroupMember::where('user_id', $userId)->pluck('group_id');
        
        $groups = Group::whereIn('id', $groupIds)->with('creator')->get();

        return response()->json([
            'message' => 'Danh sách nhóm bạn đã tham gia',
            'data' => $groups
        ]);
    }
}
