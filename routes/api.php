<?php

use App\Http\Controllers\API\Admin\AdminGroupController;
use App\Http\Controllers\API\Auth\AuthController;
use App\Http\Controllers\API\Auth\PasswordResetController;
use App\Http\Controllers\API\Admin\AdminDocumentController;
use App\Http\Controllers\API\Admin\UserManagementController;
use App\Http\Controllers\API\Admin\StatisticsController;
use App\Http\Controllers\API\Chat\AIChatController;
use App\Http\Controllers\API\Chat\GroupChatController;
use App\Http\Controllers\API\Document\DocumentController;
use App\Http\Controllers\API\Group\GroupController;
use App\Http\Controllers\API\Home\HomeController;
use App\Http\Controllers\API\Message\ChatController;
use App\Http\Controllers\API\Message\MessageController;
use App\Http\Controllers\API\Moderator\ModeratorDocumentController;
use App\Http\Controllers\API\Notification\NotificationController;
use App\Http\Controllers\API\Post\PostCommentController;
use App\Http\Controllers\API\Post\PostController;
use App\Http\Controllers\API\Student\StudentDocumentController;
use App\Http\Controllers\API\Teacher\TeacherDocumentController;
use App\Http\Controllers\API\Upload\FileUploadController;
use App\Http\Controllers\API\WebSocket\WebSocketController;
use App\Http\Controllers\API\WebSocket\WebSocketStatusController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Middleware\RegisterMiddleware;

// Register all middleware aliases directly
RegisterMiddleware::registerAll();

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Explicitly add the CSRF cookie route to the API namespace as well
// This allows both /api/sanctum/csrf-cookie and /sanctum/csrf-cookie to work
Route::get('/sanctum/csrf-cookie', [\Laravel\Sanctum\Http\Controllers\CsrfCookieController::class, 'show']);

// Public routes
Route::get('/health-check', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
        'version' => config('app.version', '1.0.0'),
        'environment' => app()->environment()
    ]);
});

// Home routes - public access
Route::prefix('home')->group(function () {
    Route::get('/popular-courses', [HomeController::class, 'getPopularCourses']);
    Route::get('/popular-documents', [HomeController::class, 'getPopularDocuments']);
    Route::get('/new-documents', [HomeController::class, 'getNewDocuments']);
    Route::get('/all-documents', [HomeController::class, 'getAllDocuments']);
    Route::get('/free-documents', [HomeController::class, 'getFreeDocuments']);
    Route::get('/recent-posts', [HomeController::class, 'getRecentPosts']);
    Route::get('/stats', [HomeController::class, 'getStats']);
});

// Authentication Routes
Route::group(['prefix' => 'auth'], function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [PasswordResetController::class, 'forgotPassword']);
    Route::post('/reset-password', [PasswordResetController::class, 'resetPassword']);
    
    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::put('/password', [AuthController::class, 'changePassword']);
        Route::post('/avatar', [AuthController::class, 'uploadAvatar']);
        Route::post('/refresh-token', [AuthController::class, 'refreshToken']);
    });
});

// WebSocket
Route::middleware('auth:sanctum')->group(function () {
    Route::post('broadcasting/auth', [WebSocketController::class, 'auth']);
    Route::get('channels', [WebSocketController::class, 'getChannels']);
    Route::get('websocket/status', [WebSocketStatusController::class, 'status']);
    Route::post('websocket/test', [WebSocketStatusController::class, 'test']);
});

// Report routes
Route::middleware(['auth:sanctum'])->prefix('reports')->group(function () {
    Route::post('/groups/{groupId}', [App\Http\Controllers\API\Report\GroupReportController::class, 'report']);
    Route::get('/user', [App\Http\Controllers\API\Report\ReportController::class, 'index']);
    Route::post('/cancel/{id}', [App\Http\Controllers\API\Report\ReportController::class, 'cancel']);
});

// Các route yêu cầu xác thực
Route::middleware(['auth:sanctum'])->group(function () {
    // Tài liệu
    Route::prefix('documents')->group(function () {
        Route::get('/', [DocumentController::class, 'index']);
        Route::get('/{document}', [DocumentController::class, 'show']);
        Route::get('/{document}/download', [DocumentController::class, 'download']);
        Route::get('/{document}/download-info', [DocumentController::class, 'getDownloadInfo']);
        Route::post('/{document}/report', [DocumentController::class, 'report']);
        Route::post('/check-exists', [DocumentController::class, 'checkFileExists']);
        
        // Trash management routes - ensure this is accessible
        Route::post('/{document}/restore', [DocumentController::class, 'restore'])->withTrashed();
        Route::delete('/{document}/force', [DocumentController::class, 'forceDelete'])->withTrashed();
        Route::delete('/trash/empty', [DocumentController::class, 'emptyTrash']);
    });

    // Bài đăng
    Route::prefix('posts')->group(function () {
        Route::get('/', [PostController::class, 'index']);
        Route::post('/', [PostController::class, 'store']);
        Route::get('/{post}', [PostController::class, 'show']);
        Route::put('/{post}', [PostController::class, 'update']);
        Route::delete('/{post}', [PostController::class, 'destroy']);
        Route::post('/{post}/like', [PostController::class, 'like']);
        Route::delete('/{post}/like', [PostController::class, 'unlike']);
        // Add new route for reporting posts
        Route::post('/{post}/report', [PostController::class, 'report']);

        // Bình luận bài đăng
        Route::get('/{post}/comments', [PostCommentController::class, 'index']);
        Route::post('/{post}/comments', [PostCommentController::class, 'store']);
        Route::get('/{post}/comments/{comment}', [PostCommentController::class, 'show']);
        Route::put('/{post}/comments/{comment}', [PostCommentController::class, 'update']);
        Route::delete('/{post}/comments/{comment}', [PostCommentController::class, 'destroy']);
        Route::post('/{post}/comments/{comment}/like', [PostCommentController::class, 'like']);
        Route::delete('/{post}/comments/{comment}/like', [PostCommentController::class, 'unlike']);
        Route::get('/{post}/comments/{comment}/replies', [PostCommentController::class, 'replies']);
        // Add new route for reporting comments
        Route::post('/{post}/comments/{comment}/report', [PostCommentController::class, 'report']);
    });

    // Nhóm
    Route::prefix('groups')->group(function () {
        Route::get('/', [GroupController::class, 'index']);
        Route::post('/', [GroupController::class, 'store']);
        Route::get('/{group}', [GroupController::class, 'show']);
        Route::put('/{group}', [GroupController::class, 'update']);
        Route::delete('/{group}', [GroupController::class, 'destroy']);
        Route::post('/{group}/join', [GroupController::class, 'join']);
        Route::post('/{group}/leave', [GroupController::class, 'leave']);
        Route::get('/{group}/join-request-status', [GroupController::class, 'checkJoinRequestStatus']);
        Route::get('/{group}/members', [GroupController::class, 'members']);
        Route::put('/{group}/members/{userId}', [GroupController::class, 'updateMember']);
        Route::delete('/{group}/members/{userId}', [GroupController::class, 'removeMember']);
        Route::get('/{group}/join-requests', [GroupController::class, 'joinRequests']);
        Route::post('/{group}/join-requests/{userId}/approve', [GroupController::class, 'approveJoinRequest']);
        Route::post('/{group}/join-requests/{userId}/reject', [GroupController::class, 'rejectJoinRequest']);
        Route::post('/{group}/chat', [GroupChatController::class, 'createFromGroup']);
        Route::get('/{group}/chat', [GroupChatController::class, 'getGroupChat']);
        
        // Add the missing route for group posts
        Route::get('/{group}/posts', [App\Http\Controllers\API\Group\GroupPostController::class, 'getGroupPosts']);
        Route::post('/{group}/posts', [App\Http\Controllers\API\Group\GroupPostController::class, 'createGroupPost']);
        
        // Group documents routes
        Route::get('/{group}/documents', [App\Http\Controllers\API\Group\GroupDocumentController::class, 'index']);
        Route::post('/{group}/documents', [App\Http\Controllers\API\Group\GroupDocumentController::class, 'store']);
        Route::get('/{group}/documents/{document}', [App\Http\Controllers\API\Group\GroupDocumentController::class, 'show']);
        Route::get('/{group}/documents/{document}/download', [App\Http\Controllers\API\Group\GroupDocumentController::class, 'download']);
    });

    // Chat
    Route::prefix('chats')->group(function () {
        Route::get('/', [ChatController::class, 'index']);
        Route::post('/', [ChatController::class, 'store']);
        Route::get('/unread-counts', [ChatController::class, 'getUnreadCounts']);
        Route::get('/{chat}', [ChatController::class, 'show']);
        Route::delete('/{chat}', [ChatController::class, 'destroy']);

        // Tin nhắn
        Route::get('/{chat}/messages', [MessageController::class, 'index']);
        Route::post('/{chat}/messages', [MessageController::class, 'store']);
        Route::post('/{chat}/read', [MessageController::class, 'markAsRead']);
        Route::delete('/{chat}/messages/{message}', [MessageController::class, 'destroy']);
    });

    // Chat nhóm
    Route::prefix('group-chats')->group(function () {
        Route::get('/', [GroupChatController::class, 'index']);
        Route::post('/', [GroupChatController::class, 'store']);
        Route::get('/{chat}', [GroupChatController::class, 'show']);
        Route::put('/{chat}', [GroupChatController::class, 'update']);
        Route::delete('/{chat}', [GroupChatController::class, 'destroy']);
        Route::post('/{chat}/participants', [GroupChatController::class, 'addParticipants']);
        Route::delete('/{chat}/participants/{userId}', [GroupChatController::class, 'removeParticipant']);
        Route::post('/{chat}/leave', [GroupChatController::class, 'leave']);
    });

    // Chat AI
    Route::prefix('ai-chats')->group(function () {
        Route::get('/', [AIChatController::class, 'index']);
        Route::post('/', [AIChatController::class, 'store']);
        Route::get('/{aiChat}', [AIChatController::class, 'show']);
        Route::put('/{aiChat}', [AIChatController::class, 'update']);
        Route::delete('/{aiChat}', [AIChatController::class, 'destroy']);
        Route::post('/{aiChat}/messages', [AIChatController::class, 'sendMessage']);
        Route::delete('/{aiChat}/messages', [AIChatController::class, 'clearHistory']);
    });

    // Thông báo
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread', [NotificationController::class, 'unread']);
        Route::post('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/read-all', [NotificationController::class, 'markAllAsRead']);
        Route::delete('/{id}', [NotificationController::class, 'destroy']);
    });

    // Tải lên file
    Route::prefix('uploads')->group(function () {
        Route::post('/initialize', [FileUploadController::class, 'initializeUpload']);
        Route::post('/chunk', [FileUploadController::class, 'uploadChunk']);
        Route::get('/{uploadId}/status', [FileUploadController::class, 'checkUploadStatus']);
        Route::post('/{uploadId}/resume', [FileUploadController::class, 'handleInterruptedUpload']);
        Route::delete('/{uploadId}', [FileUploadController::class, 'cancelUpload']);
    });

    // File storage routes - require authentication
    Route::get('/storage/file/{path}', [App\Http\Controllers\API\StorageController::class, 'getFile'])->where('path', '.*');
    Route::get('/storage/download/{path}', [App\Http\Controllers\API\StorageController::class, 'downloadFile'])->where('path', '.*');
    Route::get('/storage/preview/{path}', [App\Http\Controllers\API\StorageController::class, 'previewFile'])->where('path', '.*');

    // API cho sinh viên
    Route::prefix('student')->middleware(['auth:sanctum', 'role:student'])->group(function () {
        Route::get('/documents', [StudentDocumentController::class, 'index']);
        Route::get('/my-documents', [StudentDocumentController::class, 'myDocuments']);
        Route::post('/documents', [StudentDocumentController::class, 'store']);
        Route::get('/documents/{document}', [StudentDocumentController::class, 'show']);
        Route::put('/documents/{document}', [StudentDocumentController::class, 'update']);
        Route::delete('/documents/{document}', [StudentDocumentController::class, 'destroy']);
        Route::get('/documents/{document}/download', [StudentDocumentController::class, 'download']);
        Route::post('/documents/{document}/report', [StudentDocumentController::class, 'report']);
        Route::get('/my-documents/trash', [StudentDocumentController::class, 'trashedDocuments']);
    });

    // API cho giảng viên
    Route::prefix('teacher')->middleware(['auth:sanctum', 'role:lecturer'])->group(function () {
        Route::get('/documents', [TeacherDocumentController::class, 'index']);
        Route::get('/my-documents', [TeacherDocumentController::class, 'myDocuments']);
        Route::post('/documents', [TeacherDocumentController::class, 'store']);
        Route::get('/documents/{document}', [TeacherDocumentController::class, 'show']);
        Route::put('/documents/{document}', [TeacherDocumentController::class, 'update']);
        Route::delete('/documents/{document}', [TeacherDocumentController::class, 'destroy']);
        Route::get('/documents/{document}/download', [TeacherDocumentController::class, 'download']);
        Route::post('/documents/{document}/official', [TeacherDocumentController::class, 'markAsOfficial']);
        Route::post('/documents/{document}/report', [TeacherDocumentController::class, 'report']);
        Route::get('/my-documents/trash', [TeacherDocumentController::class, 'trashedDocuments']);
    });

    // API cho người kiểm duyệt
    Route::prefix('moderator')->middleware(['auth:sanctum', 'role:moderator'])->group(function () {
        Route::get('/documents', [ModeratorDocumentController::class, 'index']);
        Route::get('/documents/pending', [ModeratorDocumentController::class, 'pendingApproval']);
        Route::post('/documents/{document}/approve', [ModeratorDocumentController::class, 'approve']);
        Route::post('/documents/{document}/reject', [ModeratorDocumentController::class, 'reject']);
        Route::delete('/documents/{document}', [ModeratorDocumentController::class, 'delete']);
        
        // Add the missing statistics route
        Route::get('/statistics/overview', [App\Http\Controllers\API\Moderator\ModeratorStatisticsController::class, 'overview']);
        
        // Fix route order: put statistics before {id} to avoid conflicts
        Route::get('/reports/statistics', [App\Http\Controllers\API\Moderator\ReportManagementController::class, 'getStatistics']);
        Route::get('/reports/all', [App\Http\Controllers\API\Moderator\ReportManagementController::class, 'getAllReports']);
        // Regular reports routes
        Route::get('/reports', [App\Http\Controllers\API\Moderator\ReportManagementController::class, 'index']);
        Route::get('/reports/{id}', [App\Http\Controllers\API\Moderator\ReportManagementController::class, 'show']);
        Route::post('/reports/{id}/resolve', [App\Http\Controllers\API\Moderator\ReportManagementController::class, 'resolve']);
    });

    // API cho quản trị viên
    Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
        // Statistics routes
        Route::get('/statistics/overview', [StatisticsController::class, 'overview']);
        Route::get('/statistics/users', [StatisticsController::class, 'users']);
        Route::get('/statistics/documents', [StatisticsController::class, 'documents']);
        Route::get('/statistics/posts', [StatisticsController::class, 'posts']);
        Route::get('/statistics/groups', [StatisticsController::class, 'groups']);
        Route::get('/statistics/reports', [StatisticsController::class, 'reports']);
        
        // User management routes
        Route::get('/users', [UserManagementController::class, 'index']);
        Route::get('/users/{user}', [UserManagementController::class, 'show']);
        Route::put('/users/{user}/role', [UserManagementController::class, 'updateRole']);
        Route::post('/users/{user}/ban', [UserManagementController::class, 'banUser']);
        Route::post('/users/{user}/unban', [UserManagementController::class, 'unbanUser']);
        Route::delete('/users/{user}', [UserManagementController::class, 'destroy']);
        
        // Document management routes
        Route::get('/documents', [AdminDocumentController::class, 'index']);
        Route::get('/documents/statistics', [AdminDocumentController::class, 'statistics']);
        Route::get('/documents/{document}', [AdminDocumentController::class, 'show']);
        Route::put('/documents/{document}', [AdminDocumentController::class, 'update']);
        Route::delete('/documents/{document}', [AdminDocumentController::class, 'destroy']);
        Route::post('/documents/{document}/approve', [AdminDocumentController::class, 'approve']);
        Route::post('/documents/{document}/reject', [AdminDocumentController::class, 'reject']);
        
        // Group management routes
        Route::get('/groups', [AdminGroupController::class, 'index']);
        Route::get('/groups/statistics', [AdminGroupController::class, 'statistics']);
        Route::get('/groups/{group}', [AdminGroupController::class, 'show']);
        Route::get('/groups/{group}/members', [AdminGroupController::class, 'members']);
        Route::delete('/groups/{group}/members/{user}', [AdminGroupController::class, 'removeMember']);
        Route::put('/groups/{group}', [AdminGroupController::class, 'update']);
        Route::delete('/groups/{group}', [AdminGroupController::class, 'destroy']);
    });

    // Admin document management routes
    Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin|moderator'])->group(function () {
        Route::prefix('documents')->group(function () {
            Route::get('/', 'App\Http\Controllers\API\Admin\AdminDocumentController@index');
            Route::get('/statistics', 'App\Http\Controllers\API\Admin\AdminDocumentController@statistics');
            Route::get('/{document}', 'App\Http\Controllers\API\Admin\AdminDocumentController@show');
            Route::put('/{document}', 'App\Http\Controllers\API\Admin\AdminDocumentController@update');
            Route::delete('/{document}', 'App\Http\Controllers\API\Admin\AdminDocumentController@destroy');
            Route::post('/{document}/approve', 'App\Http\Controllers\API\Admin\AdminDocumentController@approve');
            Route::post('/{document}/reject', 'App\Http\Controllers\API\Admin\AdminDocumentController@reject');
        });
    });

    // Admin group management routes
    Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin|moderator'])->group(function () {
        Route::prefix('groups')->group(function () {
            Route::get('/', 'App\Http\Controllers\API\Admin\AdminGroupController@index');
            Route::get('/statistics', 'App\Http\Controllers\API\Admin\AdminGroupController@statistics');
            Route::get('/{group}', 'App\Http\Controllers\API\Admin\AdminGroupController@show');
            Route::get('/{group}/members', 'App\Http\Controllers\API\Admin\AdminGroupController@members');
            Route::put('/{group}', 'App\Http\Controllers\API\Admin\AdminGroupController@update');
            Route::delete('/{group}', 'App\Http\Controllers\API\Admin\AdminGroupController@destroy');
            Route::delete('/{group}/members/{userId}', 'App\Http\Controllers\API\Admin\AdminGroupController@removeMember');
        });
    });

    // Report routes for admin
    Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin,moderator'])->group(function () {
        Route::get('/reports', [App\Http\Controllers\API\Moderator\ReportManagementController::class, 'index']);
        Route::get('/reports/{id}', [App\Http\Controllers\API\Moderator\ReportManagementController::class, 'show']);
        Route::post('/reports/{id}/resolve', [App\Http\Controllers\API\Moderator\ReportManagementController::class, 'resolve']);
        Route::get('/reports/statistics', [App\Http\Controllers\API\Moderator\ReportManagementController::class, 'statistics']);
        Route::get('/reports/all', [App\Http\Controllers\API\Moderator\ReportManagementController::class, 'getAllReports']);
    });

    // User history routes
    Route::prefix('user')->group(function () {
        Route::get('/history', [App\Http\Controllers\API\User\UserHistoryController::class, 'index']);
        Route::get('/groups', [App\Http\Controllers\API\User\UserGroupController::class, 'index']);
        Route::get('/groups/{groupId}', [App\Http\Controllers\API\User\UserGroupController::class, 'show']);
    });

    // Post attachment routes
    Route::prefix('post-attachments')->group(function () {
        Route::get('/{attachment}/url', [App\Http\Controllers\API\Post\PostAttachmentController::class, 'getFileUrl']);
        Route::get('/{attachment}/download', [App\Http\Controllers\API\Post\PostAttachmentController::class, 'download']);
    });

    // Message attachment routes
    Route::post('/messages/{messageId}/attachments', [App\Http\Controllers\API\Message\MessageAttachmentController::class, 'upload']);
    Route::get('/message-attachments/{id}', [App\Http\Controllers\API\Message\MessageAttachmentController::class, 'show']);
    Route::get('/message-attachments/{id}/download', [App\Http\Controllers\API\Message\MessageAttachmentController::class, 'download'])
         ->name('message.attachment.download');
});

// Add a missing route for getting current authenticated user
// This route is used by the frontend to check authentication status
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Thêm route test để kiểm tra API
Route::get('/test', function () {
    return response()->json(['message' => 'API is working!']);
});
