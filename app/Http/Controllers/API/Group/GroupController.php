<?php

namespace App\Http\Controllers\API\Group;

use App\Http\Controllers\Controller;
use App\Http\Resources\GroupResource;
use App\Models\Group;
use App\Models\Chat;
use App\Models\FileUpload;
use App\Services\FileUploadService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class GroupController extends Controller
{
    protected $fileUploadService;
    protected $notificationService;
    
    public function __construct(FileUploadService $fileUploadService, NotificationService $notificationService)
    {
        $this->fileUploadService = $fileUploadService;
        $this->notificationService = $notificationService;
        $this->middleware('auth:sanctum');
    }
    
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Group::query();
        
        // Apply filters
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }
        
        if ($request->has('search')) {
            $searchTerm = $request->search;
            $query->where(function($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                  ->orWhere('description', 'like', "%{$searchTerm}%")
                  ->orWhere('course_code', 'like', "%{$searchTerm}%");
            });
        }
        
        // If user is authenticated, include their joined groups as well as public groups
        if ($user) {
            $userId = $user->id;
            
            // Use requires_approval instead of is_private
            $query->where(function($q) use ($userId) {
                // Include public groups (where requires_approval is false or null)
                $q->where('requires_approval', false)
                  ->orWhereNull('requires_approval')
                  // Include groups where the user is a member
                  ->orWhereExists(function($subquery) use ($userId) {
                      $subquery->select(\DB::raw(1))
                               ->from('users')
                               ->join('group_members', 'users.id', '=', 'group_members.user_id')
                               ->whereRaw('groups.id = group_members.group_id')
                               ->where('user_id', $userId);
                  });
            });
        } else {
            // For guest users, only include public groups
            $query->where(function($q) {
                $q->where('requires_approval', false)
                  ->orWhereNull('requires_approval');
            });
        }
        
        // Apply sorting
        if ($request->has('sort_by')) {
            $sortField = $request->sort_by;
            $sortDirection = $request->input('sort_direction', 'asc');
            
            if (in_array($sortField, ['name', 'created_at', 'member_count'])) {
                $query->orderBy($sortField, $sortDirection);
            }
        } else {
            // Default sort by newest
            $query->orderBy('created_at', 'desc');
        }
        
        $perPage = $request->input('per_page', 15);
        $groups = $query->paginate($perPage);
        
        return response()->json($groups);
    }
    
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:course,university,interest',
            'course_code' => 'nullable|string|max:255',
            'is_private' => 'nullable|boolean',
            'cover_image' => 'nullable|image|max:5120', // 5MB max
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Check if user has permission to create groups
        if (!$request->user()->can('create groups')) {
            return response()->json(['message' => 'You do not have permission to create groups'], 403);
        }
        
        // Handle cover image upload if provided
        $coverImagePath = null;
        if ($request->hasFile('cover_image')) {
            try {
                $fileUpload = $this->fileUploadService->uploadFile(
                    $request->file('cover_image'),
                    $request->user()->id,
                    'group_cover'
                );
                $coverImagePath = $fileUpload->file_path;
            } catch (\Exception $e) {
                // Log the error but continue with group creation
                \Log::error('Failed to upload cover image: ' . $e->getMessage());
            }
        }
        
        // Make sure the type is one of the allowed values
        $type = $request->input('type');
        if (!in_array($type, ['course', 'university', 'interest'])) {
            $type = 'course'; // Default to 'course' if invalid type
        }
        
        // Create the group with properly validated values
        // Check if created_by column exists in the table
        $hasCreatedByColumn = \Schema::hasColumn('groups', 'created_by');
        
        try {
            $group = new Group();
            $group->name = $request->input('name');
            $group->description = $request->input('description');
            $group->type = $type; // Use the validated type
            $group->course_code = $request->input('course_code');
            $group->requires_approval = $request->input('is_private', false);
            $group->cover_image = $coverImagePath;
            $group->creator_id = $request->user()->id;
            
            // Only set created_by if the column exists
            if ($hasCreatedByColumn) {
                $group->created_by = $request->user()->id;
            }
            
            $group->save();
            
            // Add the creator as a member and admin
            $group->members()->attach($request->user()->id, [
                'role' => 'admin',
                'status' => 'approved',
                'joined_at' => now(),
            ]);
            
            return new GroupResource($group);
        } catch (\Exception $e) {
            \Log::error('Error creating group: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to create group: ' . $e->getMessage()], 500);
        }
    }
    
    public function show(Group $group)
    {
        // Check if user can view this group
        if ($group->is_private) {
            $isMember = $group->members()->where('user_id', request()->user()->id)->exists();
            
            if (!$isMember && !request()->user()->hasRole(['admin', 'moderator'])) {
                return response()->json(['message' => 'You do not have permission to view this group'], 403);
            }
        }
        
        return new GroupResource($group);
    }
    
    public function update(Request $request, Group $group)
    {
        // Check if user has permission to update this group
        $isAdmin = $group->members()->where('user_id', $request->user()->id)->where('role', 'admin')->exists();
        
        if (!$isAdmin && !$request->user()->can('manage group members')) {
            return response()->json(['message' => 'You do not have permission to update this group'], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:course,university,interest',
            'course_code' => 'nullable|string|max:255',
            'is_private' => 'nullable|boolean',
            'cover_image' => 'nullable|image|max:5120', // 5MB max
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Handle cover image upload if provided
        if ($request->hasFile('cover_image')) {
            try {
                $fileUpload = $this->fileUploadService->uploadFile(
                    $request->file('cover_image'),
                    $request->user()->id,
                    'group_cover'
                );
                $group->cover_image = $fileUpload->file_path;
            } catch (\Exception $e) {
                // Log the error but continue with group update
                \Log::error('Failed to upload cover image: ' . $e->getMessage());
            }
        }
        
        // Update the group
        $group->update([
            'name' => $request->name,
            'description' => $request->description,
            'type' => $request->type,
            'course_code' => $request->course_code,
            'is_private' => $request->is_private ?? $group->is_private,
        ]);
        
        return new GroupResource($group);
    }
    
    public function destroy(Request $request, Group $group)
    {
        // Check if user has permission to delete this group
        $isAdmin = $group->members()->where('user_id', $request->user()->id)->where('role', 'admin')->exists();
        
        if (!$isAdmin && !$request->user()->can('manage group members')) {
            return response()->json(['message' => 'You do not have permission to delete this group'], 403);
        }
        
        // FIX: Sử dụng detach thay vì delete để tránh xóa cascade có thể ảnh hưởng đến tài khoản
        // Detach tất cả người dùng khỏi nhóm
        $group->members()->detach();
        
        // Delete all posts in the group
        foreach ($group->posts as $post) {
            // Delete post attachments
            foreach ($post->attachments as $attachment) {
                try {
                    $fileUpload = $attachment->fileUpload;
                    
                    if ($fileUpload) {
                        $this->fileUploadService->deleteFileUpload($fileUpload);
                    }
                    
                    $attachment->delete();
                } catch (\Exception $e) {
                    \Log::error('Failed to delete post attachment: ' . $e->getMessage());
                }
            }
            
            $post->delete();
        }
        
        // Delete the group cover image if it exists
        if ($group->cover_image) {
            try {
                // Find the file upload record
                $fileUpload = FileUpload::where('file_path', $group->cover_image)->first();
                
                if ($fileUpload) {
                    $this->fileUploadService->deleteFileUpload($fileUpload);
                }
            } catch (\Exception $e) {
                \Log::error('Failed to delete group cover image: ' . $e->getMessage());
            }
        }
        
        $group->delete();
        
        return response()->json(['message' => 'Group deleted successfully']);
    }
    
    public function join(Request $request, Group $group)
    {
        // Check if user is already a member
        $isMember = $group->members()->where('user_id', $request->user()->id)->exists();
        
        if ($isMember) {
            return response()->json([
                'success' => false,
                'message' => 'You are already a member of this group'
            ], 400);
        }
        
        // Check if the group is private
        if ($group->is_private) {
            // Create a join request
            $joinRequest = $group->joinRequests()->create([
                'user_id' => $request->user()->id,
                'status' => 'pending',
            ]);
            
            // Notify group admins
            $admins = $group->members()->where('role', 'admin')->get();
            
            foreach ($admins as $admin) {
                $this->notificationService->sendNotification(
                    $admin->user_id,
                    'group_join_request',
                    "{$request->user()->name} has requested to join '{$group->name}'",
                    ['group_id' => $group->id, 'user_id' => $request->user()->id]
                );
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Join request sent successfully'
            ]);
        } else {
            // Add user as a member using attach instead of create
            $group->members()->attach($request->user()->id, [
                'role' => 'member',
                'status' => 'approved',
                'joined_at' => now(),
            ]);
            
            // Update member count
            $group->increment('member_count');
            
            // Automatically add user to group chat if it exists
            $this->addMemberToGroupChat($group->id, $request->user()->id);
            
            return response()->json([
                'success' => true,
                'message' => 'Joined group successfully'
            ]);
        }
    }
    
    public function leave(Request $request, Group $group)
    {
        try {
            // Log the request for debugging
            \Log::info('Leave group request', [
                'group_id' => $group->id,
                'user_id' => $request->user() ? $request->user()->id : 'unauthenticated',
                'headers' => $request->header(),
            ]);
            
            // Explicit authentication check
            if (!$request->user()) {
                \Log::warning('Unauthenticated leave group attempt', [
                    'group_id' => $group->id,
                    'ip' => $request->ip(),
                ]);
                return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
            }
            
            // Check if user is a member
            $member = $group->members()->where('user_id', $request->user()->id)->first();
            
            if (!$member) {
                \Log::warning('Non-member attempted to leave group', [
                    'group_id' => $group->id,
                    'user_id' => $request->user()->id,
                ]);
                return response()->json([
                    'success' => false, 
                    'message' => 'You are not a member of this group'
                ], 400);
            }
            
            // Check if user is the only admin
            $isAdmin = $member->role === 'admin';
            $adminCount = $group->members()->where('role', 'admin')->count();
            
            if ($isAdmin && $adminCount === 1) {
                \Log::warning('Last admin attempted to leave group', [
                    'group_id' => $group->id,
                    'user_id' => $request->user()->id,
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot leave the group as you are the only admin. Please assign another admin first.'
                ], 400);
            }
            
            // FIX: Thay vì xóa bản ghi trực tiếp, chúng ta sẽ sử dụng detach để an toàn hơn
            // Điều này ngăn chặn lỗi xóa cascade ảnh hưởng đến tài khoản người dùng
            $userId = $request->user()->id;
            $result = $group->safeRemoveMember($userId);
            
            \Log::info('User left group successfully', [
                'group_id' => $group->id,
                'user_id' => $userId,
                'remove_result' => $result,
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Left group successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in leave group', [
                'group_id' => $group->id,
                'user_id' => $request->user() ? $request->user()->id : 'unknown',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function members(Group $group)
    {
        // Check if user can view this group
        if ($group->is_private) {
            $isMember = $group->members()->where('user_id', request()->user()->id)->exists();
            
            if (!$isMember && !request()->user()->hasRole(['admin', 'moderator'])) {
                return response()->json(['message' => 'You do not have permission to view this group'], 403);
            }
        }
        
        // Join members data with the pivot information
        $membersWithRoles = $group->members()
            ->withPivot('role', 'status', 'joined_at')
            ->paginate(20);
            
        // Transform the result to include pivot data directly in the member objects
        $transformedMembers = $membersWithRoles->map(function ($member) {
            $memberData = $member->toArray();
            
            // Add role and joined_at from pivot to main object level
            $memberData['role'] = $member->pivot->role ?? 'member';
            $memberData['status'] = $member->pivot->status ?? 'approved';
            $memberData['joined_at'] = $member->pivot->joined_at;
            
            return $memberData;
        });
        
        return response()->json([
            'success' => true,
            'data' => $transformedMembers,
            'meta' => [
                'current_page' => $membersWithRoles->currentPage(),
                'last_page' => $membersWithRoles->lastPage(),
                'per_page' => $membersWithRoles->perPage(),
                'total' => $membersWithRoles->total()
            ]
        ]);
    }
    
    public function updateMember(Request $request, Group $group, $userId)
    {
        // Check if user has permission to update members
        $isAdmin = $group->members()->where('user_id', $request->user()->id)->where('role', 'admin')->exists();
        
        if (!$isAdmin && !$request->user()->can('manage group members')) {
            return response()->json(['message' => 'You do not have permission to update members'], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'role' => 'required|in:admin,moderator,member',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Find the member
        $member = $group->members()->where('user_id', $userId)->first();
        
        if (!$member) {
            return response()->json(['message' => 'User is not a member of this group'], 404);
        }
        
        // Update the member's role
        $member->update(['role' => $request->role]);
        
        // Notify the user
        $this->notificationService->sendNotification(
            $userId,
            'group_role_updated',
            "Your role in '{$group->name}' has been updated to {$request->role}",
            ['group_id' => $group->id]
        );
        
        return response()->json(['message' => 'Member role updated successfully']);
    }
    
    public function removeMember(Request $request, Group $group, $userId)
    {
        // Check if user has permission to remove members
        $isAdmin = $group->members()->where('user_id', $request->user()->id)->where('role', 'admin')->exists();
        
        if (!$isAdmin && !$request->user()->can('manage group members')) {
            return response()->json(['message' => 'You do not have permission to remove members'], 403);
        }
        
        // Find the member
        $member = $group->members()->where('user_id', $userId)->first();
        
        if (!$member) {
            return response()->json(['message' => 'User is not a member of this group'], 404);
        }
        
        // Cannot remove yourself if you're the only admin
        if ($userId == $request->user()->id) {
            $adminCount = $group->members()->where('role', 'admin')->count();
            
            if ($member->role === 'admin' && $adminCount === 1) {
                return response()->json(['message' => 'You cannot remove yourself as you are the only admin. Please assign another admin first.'], 400);
            }
        }
        
        // FIX: Sử dụng detach thay vì delete để tránh xóa cascade ảnh hưởng đến tài khoản
        $result = $group->safeRemoveMember($userId);
        
        // Notify the user
        $this->notificationService->sendNotification(
            $userId,
            'removed_from_group',
            "You have been removed from '{$group->name}'",
            ['group_id' => $group->id]
        );
        
        return response()->json(['message' => 'Member removed successfully']);
    }

    public function checkJoinRequestStatus(Request $request, Group $group)
    {
        $user = $request->user();
        
        // Check if user is already a member
        $isMember = $group->members()->where('user_id', $user->id)->exists();
        
        if ($isMember) {
            return response()->json([
                'success' => true,
                'data' => ['status' => 'member']
            ]);
        }
        
        // Check if user has a pending join request
        $joinRequest = $group->joinRequests()->where('user_id', $user->id)->first();
        
        if ($joinRequest) {
            return response()->json([
                'success' => true,
                'data' => ['status' => $joinRequest->status]
            ]);
        }
        
        // User has no join request and is not a member
        return response()->json([
            'success' => true,
            'data' => ['status' => 'none']
        ]);
    }
    
    public function joinRequests(Request $request, Group $group)
    {
        // Check if user has permission to view join requests
        $isAdmin = $group->members()->where('user_id', $request->user()->id)->where('role', 'admin')->exists();
        
        if (!$isAdmin && !$request->user()->can('manage group members')) {
            return response()->json(['message' => 'You do not have permission to view join requests'], 403);
        }
        
        $joinRequests = $group->joinRequests()->with('user')->where('status', 'pending')->paginate(20);
        
        return response()->json($joinRequests);
    }
    
    public function approveJoinRequest(Request $request, Group $group, $userId)
    {
        // Check if user has permission to approve join requests
        $isAdmin = $group->members()->where('user_id', $request->user()->id)->where('role', 'admin')->exists();
        
        if (!$isAdmin && !$request->user()->can('manage group members')) {
            return response()->json(['message' => 'You do not have permission to approve join requests'], 403);
        }
        
        // Find the join request
        $joinRequest = $group->joinRequests()->where('user_id', $userId)->where('status', 'pending')->first();
        
        if (!$joinRequest) {
            return response()->json(['message' => 'Join request not found'], 404);
        }
        
        // Update the join request status
        $joinRequest->update(['status' => 'approved']);
        
        // Add the user as a member
        $group->members()->create([
            'user_id' => $userId,
            'role' => 'member',
        ]);
        
        // Automatically add user to group chat if it exists
        $this->addMemberToGroupChat($group->id, $userId);
        
        // Notify the user
        $this->notificationService->sendNotification(
            $userId,
            'join_request_approved',
            "Your request to join '{$group->name}' has been approved",
            ['group_id' => $group->id]
        );
        
        return response()->json(['message' => 'Join request approved successfully']);
    }
    
    public function rejectJoinRequest(Request $request, Group $group, $userId)
    {
        // Check if user has permission to reject join requests
        $isAdmin = $group->members()->where('user_id', $request->user()->id)->where('role', 'admin')->exists();
        
        if (!$isAdmin && !$request->user()->can('manage group members')) {
            return response()->json(['message' => 'You do not have permission to reject join requests'], 403);
        }
        
        // Find the join request
        $joinRequest = $group->joinRequests()->where('user_id', $userId)->where('status', 'pending')->first();
        
        if (!$joinRequest) {
            return response()->json(['message' => 'Join request not found'], 404);
        }
        
        // Update the join request status
        $joinRequest->update(['status' => 'rejected']);
        
        // Notify the user
        $this->notificationService->sendNotification(
            $userId,
            'join_request_rejected',
            "Your request to join '{$group->name}' has been rejected",
            ['group_id' => $group->id]
        );
        
        return response()->json(['message' => 'Join request rejected successfully']);
    }
    
    /**
     * Automatically add a member to the group chat when they join the group
     * 
     * @param int $groupId
     * @param int $userId
     * @return void
     */
    private function addMemberToGroupChat($groupId, $userId)
    {
        try {
            // Find the group chat if it exists
            $chat = \App\Models\Chat::where('group_id', $groupId)->first();
            
            if ($chat) {
                // Check if user is already a participant
                $isParticipant = $chat->participants()->where('user_id', $userId)->exists();
                
                if (!$isParticipant) {
                    // Add user to the chat
                    $chat->participants()->create([
                        'user_id' => $userId,
                        'is_admin' => false,
                        'joined_at' => now()
                    ]);
                    
                    \Log::info("Added user {$userId} to group chat for group {$groupId}");
                }
            }
        } catch (\Exception $e) {
            \Log::error("Failed to add user to group chat", [
                'group_id' => $groupId,
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
        }
    }
}
