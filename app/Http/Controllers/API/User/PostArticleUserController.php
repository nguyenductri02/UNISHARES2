<?php

namespace App\Http\Controllers\API\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Post;

class PostArticleUserController extends Controller
{
    /**
     * tạo bài viết.
     */
    public function postArticle(Request $request)
    {
        $user = Auth::user();
        
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);
        
        $post = Post::create([
            'user_id' => $user->id,
            'activity_type' => '1', 
            'title' => $request->title,
            'content' => $request->content,
            'points' => 3,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Đăng bài viết thành công',
            'post' => $post
        ]);
    }
}
