<?php

namespace App\Http\Controllers\API\User;

use App\Http\Controllers\Controller;
use App\Http\Resources\GroupResource;
use App\Models\Group;
use App\Models\GroupMember;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserGroupController extends Controller
{
    /**
     * Get the groups that the authenticated user is a member of
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = $user->groups();

        // Filter by status if provided
        if ($request->has('status')) {
            if ($request->status === 'active') {
                $query->wherePivot('status', 'approved');
            } elseif ($request->status === 'pending') {
                $query->wherePivot('status', 'pending');
            }
        }

        // Add eager loading for creator relationship
        $query->with('creator');

        // Get the role of the user in each group
        $groups = $query->paginate($request->per_page ?? 10);

        // Transform the groups to include additional information
        $transformedGroups = $groups->getCollection()->map(function ($group) use ($user) {
            // Get the membership details for this user
            $membership = GroupMember::where('group_id', $group->id)
                ->where('user_id', $user->id)
                ->first();

            // Add role and joined_at to the group model
            $group->role = $membership ? $membership->role : null;
            $group->joined_at = $membership ? $membership->joined_at : null;

            return $group;
        });

        // Replace the collection in the paginator
        $groups->setCollection($transformedGroups);

        return response()->json([
            'success' => true,
            'data' => GroupResource::collection($transformedGroups),
            'meta' => [
                'current_page' => $groups->currentPage(),
                'last_page' => $groups->lastPage(),
                'per_page' => $groups->perPage(),
                'total' => $groups->total()
            ]
        ]);
    }

    /**
     * Get details of a specific group
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $groupId
     * @return \Illuminate\Http\Response
     */
    public function show(Request $request, $groupId)
    {
        $user = Auth::user();
        $group = Group::with('creator')->findOrFail($groupId);

        // Check if user can view this group
        if ($group->requires_approval) {
            $isMember = $group->members()->where('user_id', $user->id)->exists();
            
            if (!$isMember && !$user->hasRole(['admin', 'moderator'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bạn không có quyền xem nhóm này'
                ], 403);
            }
        }

        // Get the user's role in this group
        $membership = GroupMember::where('group_id', $group->id)
            ->where('user_id', $user->id)
            ->first();

        // Add role and joined_at to the group model
        if ($membership) {
            $group->role = $membership->role;
            $group->joined_at = $membership->joined_at;
        }

        // Get member count
        $group->member_count = $group->members()->count();

        return response()->json([
            'success' => true,
            'data' => new GroupResource($group)
        ]);
    }

    /**
     * Leave a group
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $groupId
     * @return \Illuminate\Http\Response
     */
    public function leave(Request $request, $groupId)
    {
        $user = Auth::user();
        $group = Group::findOrFail($groupId);

        // Check if user is a member
        $member = $group->members()->where('user_id', $user->id)->first();
        
        if (!$member) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không phải là thành viên của nhóm này'
            ], 400);
        }

        // Check if user is the only admin
        $isAdmin = $member->role === 'admin';
        $adminCount = $group->members()->where('role', 'admin')->count();
        
        if ($isAdmin && $adminCount === 1) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không thể rời khỏi nhóm vì bạn là admin duy nhất. Vui lòng chỉ định một admin khác trước.'
            ], 400);
        }

        // Remove user from the group
        $member->delete();

        return response()->json([
            'success' => true,
            'message' => 'Rời khỏi nhóm thành công'
        ]);
    }
}
