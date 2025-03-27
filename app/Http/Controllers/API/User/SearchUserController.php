<?php

namespace App\Http\Controllers\Api\User;

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class SearchUserController extends Controller
{
    /**
     * Tìm kiếm user theo user_name.
     */
    public function searchUser(Request $request)
    {       
        $perPage = $request->query('per_page');

        $query = User::query();
        //ktra co user_name chua, && co rong khong
        if ($request->has('user_name') && !empty($request->user_name)) {
            $query->where('user_name', $request->user_name)
                  ->orWhere('email', $request->user_name);;
        }

        if ($perPage === null) {
            return response()->json($query->get());
        }

        $perPage = min(max($perPage, 1), 50);
        $users = $query->paginate($perPage);

        return response()->json($users);
    }
}
// k nhap phan trang thi lay all. lấy username vs dia chi email k lay like
// nhap 1 trong 2 van duoc 