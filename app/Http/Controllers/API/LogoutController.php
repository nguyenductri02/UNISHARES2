<?php

namespace App\Http\Controllers\API;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\API\BaseController as BaseController;
   
class LogoutController extends BaseController
{
    /**
     * Logout api
     *
     * @return \Illuminate\Http\Response
     */
    
    public function logout(Request $request)
    {
        $user = auth('sanctum')->user(); 

        if ($user) {
            $user->tokens()->delete();
            return response()->json(['message' => 'User logged out']);
        }

        return response()->json(['error' => 'Unauthenticated'], 401);
    }
}