<?php

namespace App\Http\Controllers\API\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Group;
use App\Models\GroupMember;
use Illuminate\Support\Facades\Auth;

class GroupStudyUserController extends Controller
{
    //  /**
    //  * Tham gia nhóm học tập theo môn học hoặc trường.
    //  */
    public function joinGroup(Request $request)
    {
        $request->validate([
            'group_id' => 'required_without_all:subject,university|exists:groups,id',
            'subject' => 'required_without_all:group_id,university|string',
            'university' => 'required_without_all:group_id,subject|string',
        ]);

        $userId = Auth::id();
        $group = null;
        
        if ($request->group_id) {
            $group = Group::find($request->group_id);
        }
       
        elseif ($request->subject) {
            $group = Group::where('subject', $request->subject)->first();
        }
        
        elseif ($request->university) {
            $group = Group::where('university', $request->university)->first();
        }

        if (!$group) {
            return response()->json(['message' => 'Không tìm thấy nhóm phù hợp.'], 404);
        }

        
        $alreadyJoined = GroupMember::where('group_id', $group->id)
            ->where('user_id', $userId)
            ->exists();

        if ($alreadyJoined) {
            return response()->json(['message' => 'Bạn đã tham gia nhóm này rồi.'], 409);
        }

        
        GroupMember::create([
            'group_id' => $group->id,
            'user_id' => $userId,
            'role_group_members' => '1', 
        ]);

        return response()->json(['message' => 'Tham gia nhóm thành công!', 'group' => $group]);
    }
}
