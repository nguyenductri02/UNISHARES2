<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
  
use App\Http\Controllers\MailController;
use App\Http\Controllers\API\LoginController;
use App\Http\Controllers\API\LogoutController;
use App\Http\Controllers\API\ProductController;
use App\Http\Controllers\API\RegisterController;
use App\Http\Controllers\API\ForgotPasswordController;
   
Route::controller(RegisterController::class)->group(function(){
    Route::post('register', 'register');    
});

Route::controller(LoginController::class)->group(function(){    
    Route::post('login', 'login');    
});

Route::controller(LogoutController::class)->group(function(){   
    Route::post('logout',  'logout');
});

Route::controller(ForgotPasswordController::class)->group(function(){   
    Route::post('sendResetCode',  'sendResetCode');
});

Route::controller(ForgotPasswordController::class)->group(function(){   
    Route::post('resetPassword',  'resetPassword');
});
         
Route::middleware('auth:sanctum')->group( function () {
    Route::resource('products', ProductController::class);
});

// Route::post('/send-email', [MailController::class, 'sendEmail']);
//request 