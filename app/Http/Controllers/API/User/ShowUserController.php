<?php

namespace App\Http\Controllers\API\User;

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;

class ShowUserController extends Controller
{
    public function showUser(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        return response()->json([
            'data' => [
                'full_name' => $user->full_name,
                'dob'       => $user->dob,
                'phone'     => $user->phone,
                'email'     => $user->email,
                'address'   => $user->address,
                'gender'    => $user->gender,
                'role'      => $user->role,
            ]
        ]);
    }
}
