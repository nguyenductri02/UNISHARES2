<?php

namespace App\Http\Controllers\Api\User;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\lang;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\API\BaseController as BaseController;

class CreateUserController extends BaseController
{
    /**
     * Tạo mới user với validation.
     */
    

     public function createUser(Request $request)
     {
         $messages = lang::get('messages');
     
         $validator = Validator::make($request->all(), [
             'user_name' => 'required',
             'phone' => 'required|digits:10|unique:users,phone',
             'email' => 'required|email|unique:users,email',
             'password' => 'required',
             'c_password' => 'required|same:password',
             'role' => 'required|in:1,2',
             'address' => 'required',
             'full_name'  => 'nullable|string|max:255',
             'university' => 'nullable|string|max:255', 
             'major'      => 'nullable|string|max:255', // nganh 
             'profile_picture_url' => 'nullable|url',
             // 'is_verified' => 'boolean',
             'is_verified' => 'required|in:1,2', // xac minh
             'contribution_points' => 'nullable|integer|min:0', // dong gop
             'avatar'     => 'nullable|image|max:2048'
         ],$messages);
    
         if($validator->fails()){
             return $this->sendError('Validation Error.', $validator->errors());       
         }
             // Xử lý avatar 
         $avatarPath = null;
         if ($request->hasFile('avatar')) {
             $avatarPath = $request->file('avatar')->store('avatars', 'public');
         }
         $input = $request->all();
         $input['password'] = bcrypt($input['password']);
         $user = User::create([
             'user_name' => $input['user_name'],
             'phone'     => $input['phone'],
             'email'     => $input['email'],
             'password'  => $input['password'],
             'role'      => $input['role'],
             'address'   => $input['address'],
              'full_name'  => $request->full_name,
             'university' => $request->university,
             'major'      => $request->major,
             'profile_picture_url' => $request->profile_picture_url,
             // 'is_verified' => $request->is_verified,
             'is_verified'      => $input['is_verified'],
             'contribution_points' => $request->contribution_points,
             'avatar'     => $avatarPath
         ]);
         $success['token'] =  $user->createToken('MyApp')->plainTextToken;
         $success['name'] =  $user->user_name;
    
         return $this->sendResponse($success, 'User register successfully.');
     } 
}
