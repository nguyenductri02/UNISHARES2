<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use Illuminate\Support\Facades\Response;
use App\Http\Controllers\Api\DemoController;
use App\Http\Controllers\API\FileController;
use App\Http\Controllers\API\LoginController;
use App\Http\Controllers\API\LogoutController;
use App\Http\Controllers\API\ProductController;
use App\Http\Controllers\API\RegisterController;
use App\Http\Controllers\API\User\AvatarController;
use App\Http\Controllers\API\User\GetUsersController;
use App\Http\Controllers\API\User\ShowUserController;
use App\Http\Controllers\API\ForgotPasswordController;
use App\Http\Controllers\Api\User\CreateUserController;
use App\Http\Controllers\API\User\SearchUserController;
use App\Http\Controllers\API\User\DeleteUsersController;
use App\Http\Controllers\API\User\UpdateUsersController;

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
Route::get('/login', function () {
    return response()->json(['error' => 'Unauthorized'], 401);
})->name('login');


/**
     * Logout api
*/
Route::controller(LogoutController::class)->group(function(){   
    Route::post('logout',  'logout');
});



/**
     * nhan ma code den gmail
*/
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
Route::middleware(['auth:sanctum'])->controller(GetUsersController::class)->group(function(){
    Route::get('getUsers', 'getUsers');
});

/**
     * search user
*/
Route::middleware(['auth:sanctum'])->controller(SearchUserController::class)->group(function(){
    Route::get('searchUser', 'searchUser');
});

/**
     * tao moi user
*/
Route::middleware(['auth:sanctum'])->controller(CreateUserController::class)->group(function(){
    Route::post('createUser', 'createUser');     
});

/**
     * update user
*/
Route::middleware(['auth:sanctum'])->controller(UpdateUsersController::class)->group(function(){   
    Route::post('updateUser/{id}', 'updateUser');
});

/**
     * delete user
*/
Route::middleware(['auth:sanctum'])->controller(DeleteUsersController::class)->group(function(){    
    Route::delete('deleteUser/{id}', 'deleteUser');
});


/**
     * upload avatarr
*/
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::post('avatarUpload/{id}', [AvatarController::class, 'avatarUpload']);


Route::get('/user_img/{filename}', function ($filename) {
    $path = storage_path('app/private/public/user_img/' . $filename);

    if (!file_exists($path)) {
        abort(404);
    }

    $file = file_get_contents($path);// đọc file
    $type = mime_content_type($path); // lấy đuôi pnj,..

    return Response::make($file, 200)->header("Content-Type", $type);
});

/**
     * upload files
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::post('filesUpload/{id}', [FileController::class, 'filesUpload']);


Route::get('/user_file/{filename}', function ($filename) {
    $path = storage_path('app/private/public/user_file/' . $filename);

    if (!file_exists($path)) {
        abort(404);
    }

    $file = file_get_contents($path);// đọc file
    $type = mime_content_type($path); // lấy đuôi pnj,..

    return Response::make($file, 200)->header("Content-Type", $type);
});

/**
     * show thong tin nguoi dung
*/
Route::controller(ShowUserController::class)->group(function () {
    Route::get('showUser', 'showUser'); 
});

/**
     * search documents, groups
*/
Route::controller(DemoController::class)->group(function () {
    Route::get('searchDocuments', 'searchDocuments');
    Route::get('searchGroups', 'searchGroups');
});