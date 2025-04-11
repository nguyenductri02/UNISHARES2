<?php

namespace App\Http\Controllers\Api\User;

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\API\BaseController as BaseController;

class GetUsersController extends BaseController
{
    //  /**
    //  * phân trang.
    //  */
    
    public function getUsers(Request $request)
    {
        // Lấy user hiện tại
        $user = Auth::user();

        // Kiểm tra quyền: chỉ role 2 được phép
        if ($user->role != 2) {
            return $this->sendError(
                'Unauthorized',
                ['error' => 'Only admins can access this endpoint'],
                403
            );
        }

        $perPage = $request->query('per_page', null);

        if ($perPage === null) {
            return $this->sendResponse(User::all(), 'All users retrieved');
        }

        $perPage = min(max($perPage, 1), 50); 
        $users = User::paginate($perPage);

        return $this->sendResponse($users, 'Users retrieved with pagination');
    }
}
