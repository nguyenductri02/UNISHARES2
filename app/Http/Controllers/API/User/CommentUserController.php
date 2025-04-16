<?php

namespace App\Http\Controllers\API\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Comment;
use App\Models\Document;

class CommentUserController extends Controller
{
    /**
     * tạo 1 cmt.
     */
    public function comment(Request $request, $document_id)
    {
        $user = Auth::user();
       
        $document = Document::find($document_id);
        if (!$document) {
            return response()->json([
                'status' => false,
                'message' => 'Document not found'
            ], 404);
        }
        
        $request->validate([
            'content' => 'required|string|min:1'
        ]);
        
        $comment = Comment::create([
            'content' => $request->input('content'),
            'user_id' => $user->id,
            'document_id' => $document_id,
            'upvote_count' => 0,
            'downvote_count' => 0
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Comment added successfully',
            'comment' => $comment
        ]);
    }
}
