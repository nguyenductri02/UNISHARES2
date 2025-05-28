<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\API\PaginationController;
use App\Http\Controllers\Controller;
use App\Http\Resources\GroupResource;
use App\Http\Resources\GroupMemberResource;
use App\Models\Group;
use App\Models\GroupMember;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdminGroupController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
        
        // Middleware to ensure only admins and moderators can access these routes
        $this->middleware('auth:sanctum');
        $this->middleware('role:admin|moderator');
    }

    /**
     * Display a listing of all groups for admin management
     *
     * @param Request $request
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
    public function index(Request $request)
    {
        $query = Group::query();
        
        // Apply filters
        if ($request->has('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }
        
        if ($request->has('is_private')) {
            $query->where('is_private', filter_var($request->is_private, FILTER_VALIDATE_BOOLEAN));
        }
        
        if ($request->has('creator_id')) {
            $query->where('creator_id', $request->creator_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('description', 'like', '%' . $search . '%')
                  ->orWhere('course_code', 'like', '%' . $search . '%');
            });
        }
        
        // Sort by
        if ($request->has('sort_by')) {
            $sortDirection = $request->has('sort_desc') && $request->sort_desc === 'true' ? 'desc' : 'asc';
            
            switch ($request->sort_by) {
                case 'name':
                    $query->orderBy('name', $sortDirection);
                    break;
                case 'member_count':
                    $query->orderBy('member_count', $sortDirection);
                    break;
                case 'created_at':
                    $query->orderBy('created_at', $sortDirection);
                    break;
                default:
                    $query->latest();
                    break;
            }
        } else {
            $query->latest(); // Default sorting by latest
        }
        
        // Eager load creator relationship
        $query->with('creator');
        
        // Paginate the results
        $groups = PaginationController::paginate($query, $request);
        
        return GroupResource::collection($groups);
    }

    /**
     * Display the specified group
     *
     * @param Group $group
     * @return GroupResource
     */
    public function show(Group $group)
    {
        // Load relationships for detailed view
        $group->load(['creator', 'members.user']);
        
        return new GroupResource($group);
    }

    /**
     * Get members of a group
     *
     * @param Group $group
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
    public function members(Group $group)
    {
        $members = GroupMember::where('group_id', $group->id)
            ->with('user')
            ->get();
            
        return GroupMemberResource::collection($members);
    }

    /**
     * Remove a member from a group
     *
     * @param Group $group
     * @param int $userId
     * @return \Illuminate\Http\JsonResponse
     */
    public function removeMember(Group $group, $userId)
    {
        $member = GroupMember::where('group_id', $group->id)
            ->where('user_id', $userId)
            ->first();
            
        if (!$member) {
            return response()->json([
                'message' => 'User is not a member of this group',
                'success' => false
            ], 404);
        }
        
        // Check if this is the last admin
        $isLastAdmin = $member->role === 'admin' && 
            GroupMember::where('group_id', $group->id)
                ->where('role', 'admin')
                ->count() <= 1;
                
        if ($isLastAdmin) {
            return response()->json([
                'message' => 'Cannot remove the last admin of the group',
                'success' => false
            ], 400);
        }
        
        // Delete the member
        $member->delete();
        
        // Update member count
        $group->decrement('member_count');
        
        // Notify the user
        try {
            $this->notificationService->sendNotification(
                $userId,
                'group_removed',
                "An administrator has removed you from the group '{$group->name}'",
                ['group_id' => $group->id]
            );
        } catch (\Exception $e) {
            \Log::error('Failed to send notification: ' . $e->getMessage());
        }
        
        return response()->json([
            'message' => 'Member removed successfully',
            'success' => true
        ]);
    }

    /**
     * Update group details
     *
     * @param Request $request
     * @param Group $group
     * @return GroupResource
     */
    public function update(Request $request, Group $group)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'sometimes|required|string|in:course,public,private',
            'is_private' => 'nullable|boolean',
            'course_code' => 'nullable|string|max:255',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Update group fields that are present in the request
        $group->fill($request->only([
            'name', 'description', 'type', 'is_private', 'course_code'
        ]));
        
        $group->save();
        
        return new GroupResource($group);
    }

    /**
     * Remove the specified group
     *
     * @param Group $group
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Group $group)
    {
        // Get members for notification before deletion
        $members = GroupMember::where('group_id', $group->id)
            ->get(['user_id']);
        
        // Delete the group (cascade will handle members, posts, etc.)
        $group->delete();
        
        // Notify all members
        foreach ($members as $member) {
            try {
                $this->notificationService->sendNotification(
                    $member->user_id,
                    'group_deleted',
                    "The group '{$group->name}' has been deleted by an administrator",
                    []
                );
            } catch (\Exception $e) {
                \Log::error('Failed to send notification: ' . $e->getMessage());
            }
        }
        
        return response()->json([
            'message' => 'Group deleted successfully',
            'success' => true
        ]);
    }

    /**
     * Get group statistics
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function statistics()
    {
        $stats = [
            'total' => Group::count(),
            'course_groups' => Group::where('type', 'course')->count(),
            'public_groups' => Group::where('type', 'public')->count(),
            'private_groups' => Group::where('is_private', true)->count(),
            'largest_groups' => $this->getLargestGroups(),
            'most_active_groups' => $this->getMostActiveGroups(),
            'groups_by_month' => $this->getGroupsByMonth(),
        ];
        
        return response()->json([
            'data' => $stats,
            'success' => true
        ]);
    }
    
    /**
     * Get largest groups by member count
     *
     * @return array
     */
    private function getLargestGroups()
    {
        return Group::with('creator')
            ->orderByDesc('member_count')
            ->limit(5)
            ->get()
            ->map(function ($group) {
                return [
                    'id' => $group->id,
                    'name' => $group->name,
                    'member_count' => $group->member_count,
                    'creator' => $group->creator ? $group->creator->name : 'Unknown'
                ];
            });
    }
    
    /**
     * Get most active groups by post count
     *
     * @return array
     */
    private function getMostActiveGroups()
    {
        return Group::withCount('posts')
            ->orderByDesc('posts_count')
            ->limit(5)
            ->get()
            ->map(function ($group) {
                return [
                    'id' => $group->id,
                    'name' => $group->name,
                    'post_count' => $group->posts_count,
                    'member_count' => $group->member_count
                ];
            });
    }
    
    /**
     * Get group creation by month
     *
     * @return array
     */
    private function getGroupsByMonth()
    {
        $startDate = now()->subMonths(11)->startOfMonth();
        
        $results = Group::selectRaw('COUNT(*) as count, YEAR(created_at) as year, MONTH(created_at) as month')
            ->where('created_at', '>=', $startDate)
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get();
        
        $monthlyData = [];
        
        // Initialize all months with zero count
        for ($i = 0; $i < 12; $i++) {
            $date = now()->subMonths(11 - $i)->startOfMonth();
            $monthlyData[$date->format('Y-m')] = [
                'year' => $date->year,
                'month' => $date->month,
                'month_name' => $date->format('M'),
                'count' => 0
            ];
        }
        
        // Fill in actual counts
        foreach ($results as $result) {
            $key = sprintf('%d-%02d', $result->year, $result->month);
            if (isset($monthlyData[$key])) {
                $monthlyData[$key]['count'] = $result->count;
            }
        }
        
        return array_values($monthlyData);
    }
}
