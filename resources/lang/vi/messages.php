<?php

return [
    'full_name' => [
        'required' => 'Vui lòng nhập họ tên.',
        'regex' => 'Họ tên chỉ được chứa chữ cái và khoảng trắng.',
    ],
    'email' => [
        'required' => 'Email không được để trống.',
        'email' => 'Email phải đúng định dạng.',
        'unique' => 'Email này đã được sử dụng.',    ],
    
    'phone' => [
        'required' => 'Số điện thoại không được để trống.',
        'digits' => 'Số điện thoại phải có đúng 10 chữ số.',
        'unique' => 'Số điện thoại này đã được sử dụng.',
    ],
    'password' => [
        'required' => 'Mật khẩu không được để trống.',
    ],
    'c_password' => [
        'required' => 'Vui lòng xác nhận mật khẩu.',
        'same' => 'Mật khẩu xác nhận không khớp.',
    ],
    'role' => [
        'required' => 'Vai trò không được để trống.',
        'in' => 'Vai trò phải là student hoặc teacher.',
    ],   
    'is_verified' => [
        'required' => 'is_verified không được để trống.',
        'in' => 'Trường is verified phải là 1 hoặc 2.',
    ],
    'contribution_points' => [        
        'in' => 'Trường contribution_points phải là so nguyen.',
    ],
  
];
 
            
 