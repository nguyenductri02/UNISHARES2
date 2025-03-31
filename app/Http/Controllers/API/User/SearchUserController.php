<?php

namespace App\Http\Controllers\Api\User;

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\API\BaseController as BaseController;

class SearchUserController extends BaseController
{
    /**
     * Tìm kiếm user theo user_name.
     */
    public function searchUser(Request $request)
    {       
        // $perPage = $request->query('per_page');

        // $query = User::query();
        // //ktra co user_name chua, && co rong khong
        // if ($request->has('user_name') && !empty($request->user_name)) {
        //     $query->where('user_name', $request->user_name)
        //           ->orWhere('email', $request->user_name);;
        // }

        // if ($perPage === null) {
        //     return response()->json($query->get());
        // }

        // $perPage = min(max($perPage, 1), 50);
        // $users = $query->paginate($perPage);

        // return response()->json($users);
        $user = Auth::user();
        $searchId = $request->query('id'); // query: truy vấn

        if (!$searchId) {
            return $this->sendError('ID is required', [], 400);
        }

        if ($user->role == 2) {
            $foundUser = User::find($searchId);
            if (!$foundUser) {
                return $this->sendError('User not found', [], 404);
            }
            return $this->sendResponse($foundUser, 'User found');
        }

        if ($user->role == 1) {
            if ($user->id != $searchId) {
                return $this->sendError(
                    'Unauthorized',
                    ['error' => 'You can only search your own information'],
                    403
                );
            }
            return $this->sendResponse($user, 'User info retrieved');
        }

        return $this->sendError('Invalid role', [], 400);
    }
}
// k nhap phan trang thi lay all. lấy username vs dia chi email k lay like
// nhap 1 trong 2 van duoc 