<?php

namespace App\Http\Controllers\Api\User;

use App\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\API\BaseController as BaseController;

class DeleteUsersController extends BaseController
{
    /**
     * Xóa user.
     */
    
    public function deleteUser($id)
    {
        // Lấy user hiện tại
        $currentUser = Auth::user();

        // Kiểm tra quyền: chỉ role 2 được phép
        if ($currentUser->role != 2) {
            return $this->sendError(
                'Unauthorized',
                ['error' => 'Only admins can delete users'],
                403
            );
        }

        $user = User::find($id);
        if (!$user) {
            return $this->sendError('User not found', [], 404);
        }

        $user->delete();

        return $this->sendResponse(null, 'User deleted successfully');
    }
}
