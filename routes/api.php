<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use Illuminate\Support\Facades\Response;
use App\Http\Controllers\Api\DemoController;
use App\Http\Controllers\API\LoginController;
use App\Http\Controllers\API\LogoutController;
use App\Http\Controllers\API\ProductController;
use App\Http\Controllers\API\RegisterController;
use App\Http\Controllers\API\User\GetUsersController;
use App\Http\Controllers\API\User\ShowUserController;
use App\Http\Controllers\API\ForgotPasswordController;
use App\Http\Controllers\API\User\SearchUserController;
use App\Http\Controllers\API\User\CommentUserController;
use App\Http\Controllers\API\User\DeleteUsersController;

use App\Http\Controllers\API\User\MyGroupUserController;
use App\Http\Controllers\API\User\ShowGroupUserController;
use App\Http\Controllers\API\User\DeleteFileUserController;

use App\Http\Controllers\API\User\GroupStudyUserController;
use App\Http\Controllers\API\User\MyDocumentUserController;
use App\Http\Controllers\API\User\UploadFileUserController;
use App\Http\Controllers\API\User\PostArticleUserController;
use App\Http\Controllers\API\User\DownloadFileUserController;
use App\Http\Controllers\Api\User\CreateAccountUserController;
use App\Http\Controllers\API\User\UpdateProfileUserController;
use App\Http\Controllers\API\User\UploadPictureUserController;
use App\Http\Controllers\API\User\RatingDocumentUserController;
use App\Http\Controllers\API\User\UploadFileHistoryUserController;
use App\Http\Controllers\API\User\ReportDocumentPostUserController;


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
Route::middleware(['auth:sanctum'])->controller(CreateAccountUserController::class)->group(function(){
    Route::post('createUser', 'createUser');     
});

/**
     * update user
*/
Route::middleware(['auth:sanctum'])->controller(UpdateProfileUserController::class)->group(function(){   
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

Route::post('avatarUpload/{id}', [UploadPictureUserController::class, 'avatarUpload']);


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

Route::post('filesUpload/{id}', [UploadFileUserController::class, 'filesUpload']);


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
     * download files
*/
Route::controller(DownloadFileUserController::class)->group(function () {
    Route::get('downloadFile/{filename}', 'downloadFile');
});

/**
     * delete files
*/
Route::middleware('auth:sanctum')->controller(DeleteFileUserController::class)->group(function () {
    Route::delete('deleteFile/{id}', 'deleteFile');
});
/**
     * cmt
*/
Route::middleware('auth:sanctum')->controller(CommentUserController::class)->group(function () {
    Route::post('comment/{document_id}', 'comment');
});

/**
     * rating documents
*/
Route::middleware('auth:sanctum')->controller(RatingDocumentUserController::class)->group(function () {
    Route::post('rateDocument/{document_id}', 'rate');
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

/**
     * up post
*/
Route::middleware('auth:sanctum')->controller(PostArticleUserController::class)->group(function () {
    Route::post('postArticle', 'postArticle');
});

/**
     * report document
*/

Route::controller(ReportDocumentPostUserController::class)->group(function () {
    Route::post('report', 'report'); 
});

/**
     * joinGroup study
*/
Route::controller(GroupStudyUserController::class)->group(function () {
    Route::post('joinGroup', 'joinGroup'); 
});

/**
     * show all group
*/
Route::controller(ShowGroupUserController::class)->group(function(){
    Route::get('showgroups', 'showgroups');
});

/**
     * show group my join
*/

Route::middleware('auth:sanctum')->controller(MyGroupUserController::class)->group(function () {
    Route::get('myGroups', 'myGroups');
});

/**
     * show group my Document
*/

Route::middleware('auth:sanctum')->controller(MyDocumentUserController::class)->group(function () {
    Route::get('myDocuments', 'myDocuments');
});

/**
     * upload file history
*/
Route::middleware('auth:sanctum')->get('upload-history', [UploadFileHistoryUserController::class, 'uploadHistory']);