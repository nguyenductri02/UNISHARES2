<?php

namespace App\Http\Controllers\API;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\API\BaseController as BaseController;
use Illuminate\Support\Facades\lang;
   
class RegisterController extends BaseController
{
    /**
     * tạo tài khoản 
     *
     * @return \Illuminate\Http\Response
     */
    public function register(Request $request)
    {
        $messages = lang::get('messages');
    
        $validator = Validator::make($request->all(), [
            //'user_name' => 'required',
            'full_name'  => ['required', 'regex:/^[\pL\s]+$/u', 'max:255'],
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
        
        $input = $request->only(['full_name', 'phone', 'email', 'password', 'role']);
        
        $input['full_name'] = ucwords(strtolower(trim($input['full_name'])));//chuẩn hóa tên người dùng
        
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
        $success['token'] = $user->createToken('MyApp')->plainTextToken;
        // $success['name'] =  $user->user_name;
        $success['name'] =  $user->full_name;
   
        return $this->sendResponse($success, 'User register successfully.');
    } 

}



























































//$success['token'] =  $user->createToken('MyApp')->plainTextToken; 
//$user->createToken('MyApp'): tao 1 token moi 
// ->plainTextToken;  su dung duoc ngay
//'MyApp': teen token   
//success : thanh cong
//required: yeu cau
//unique: doc nhat
//tìm kiếm một file ngôn ngữ có tên messages.php trong thư mục resources/lang/vi/.
//validator trình sử lý
// $input = $request->all();: Lấy tất cả dữ liệu được gửi từ request (Postman hoặc frontend) vào biến $input.
// $user = User::create // tao 1 usermoi trong database