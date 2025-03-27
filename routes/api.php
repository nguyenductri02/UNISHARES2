<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\API\LoginController;
use App\Http\Controllers\API\LogoutController;
use App\Http\Controllers\API\ProductController;
use App\Http\Controllers\API\User\GetUsersController;
use App\Http\Controllers\API\RegisterController;
use App\Http\Controllers\API\User\SearchUserController;
use App\Http\Controllers\API\User\DeleteUsersController;
use App\Http\Controllers\API\User\UpdateUsersController;
use App\Http\Controllers\API\ForgotPasswordController;
use App\Http\Controllers\Api\User\CreateUserController;

/**
     * Register api
 */
Route::controller(RegisterController::class)->group(function(){
    Route::post('register', 'register');    
});

/**
     * Login api
*/
Route::controller(LoginController::class)->group(function(){    
    Route::post('login', 'login');    
});

/**
     * Logout api
*/
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

/**
     * phan trang user
*/
Route::controller(GetUsersController::class)->group(function(){
    Route::get('getUsers', 'getUsers');
});

/**
     * tim kiem user
*/
Route::controller(SearchUserController::class)->group(function(){
    Route::post('searchUser', 'searchUser');
});

/**
     * tao moi user
*/
Route::controller(CreateUserController::class)->group(function(){
    Route::post('createUser', 'createUser');     
});

/**
     * update user
*/
Route::controller(UpdateUsersController::class)->group(function(){   
    Route::put('updateUser/{id}', 'updateUser');
});

/**
     * delete user
*/
Route::controller(DeleteUsersController::class)->group(function(){    
    Route::delete('deleteUser/{id}', 'deleteUser');
});
