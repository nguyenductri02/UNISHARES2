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
    //  * Lấy danh sách user, nếu nhiều hơn 5 thì phân trang.
    //  */
    // public function getUsers(Request $request)
    // {
    //     // $allowedPerPage = [5, 10, 15, 20];
    //     $perPage = $request->query('per_page', 5);
    //     // if (!in_array($perPage, $allowedPerPage)) {
    //     //     $perPage = 5;
    //     // }
    //     $perPage = min(max($perPage, 1), 50);
    //     $users = User::paginate($perPage);
       
    //     return response()->json($users);
    // }
    // public function getUsers(Request $request)
    // {        
    //     $perPage = $request->query('per_page', null);

    //     if ($perPage === null) {
    //         return response()->json(User::all());
    //     }

    //     $perPage = min(max($perPage, 1), 50);
    //     $users = User::paginate($perPage);

    //     return response()->json($users);
    // }
    // Lấy user hiện tại
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
