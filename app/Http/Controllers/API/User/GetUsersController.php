<?php

namespace App\Http\Controllers\Api\User;

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class GetUsersController extends Controller
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
    public function getUsers(Request $request)
    {        
        $perPage = $request->query('per_page', null);

        if ($perPage === null) {
            return response()->json(User::all());
        }

        $perPage = min(max($perPage, 1), 50);
        $users = User::paginate($perPage);

        return response()->json($users);
    }
}
