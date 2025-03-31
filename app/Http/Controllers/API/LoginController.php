<?php

namespace App\Http\Controllers\API;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\API\BaseController as BaseController;
   
class LoginController extends BaseController
{   
    /**
     * Login api
     *
     * @return \Illuminate\Http\Response
     */
    public function login(Request $request){
        $user = User::where('email',  $request->email)->first();
          if (! $user || ! Hash::check($request->password, $user->password)) 
      {
            return response()->json([
                'message' => ['Username or password incorrect'],
            ]);
        }

        $user->tokens()->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'User logged in successfully',
            'name' => $user->name,
            'token' => $user->createToken('auth_token')->plainTextToken,
        ]);
    }
}




































































// dunng auth:attempt de kiem tra email vs mk
// neu dung lay thong tin user cho login
//tao token api
// Trả về thông tin user + token API. cho client
//return 
// else
// return 