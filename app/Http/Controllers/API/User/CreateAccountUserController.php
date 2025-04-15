<?php

namespace App\Http\Controllers\Api\User;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\lang;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\API\BaseController as BaseController;

class CreateAccountUserController extends BaseController
{/**
     * tạo tài khoản 
     *
     * @return \Illuminate\Http\Response
     */
    public function register(Request $request)
    {
        $messages = lang::get('messages');
    
        $validator = Validator::make($request->all(), [
            //'user_name' => 'required',
            'full_name' => 'required',
            'phone' => 'required|digits:10|unique:users,phone',
            'email' => 'required|email|unique:users,email',
            'password' => 'required',
            'c_password' => 'required|same:password',
            'role' => 'required|in:1,2',
            //'address' => 'required',
            // 'dob' => 'required',
        ],$messages);
   
        if($validator->fails()){
            return $this->sendError('Validation Error.', $validator->errors());       
        }
        
        $input = $request->all();
        $input['password'] = bcrypt($input['password']);
        $user = User::create([
            //'user_name' => $input['user_name'],
            'full_name' => $input['full_name'],
            'phone'     => $input['phone'],
            'email'     => $input['email'],
            'password'  => $input['password'],
            'role'      => $input['role'],
            //'address'   => $input['address'],
            // 'dob'   => $input['dob'],
        ]);
        $success['token'] =  $user->createToken('MyApp')->plainTextToken;
        // $success['name'] =  $user->user_name;
        $success['name'] =  $user->full_name;
   
        return $this->sendResponse($success, 'User register successfully.');
    } 
}
