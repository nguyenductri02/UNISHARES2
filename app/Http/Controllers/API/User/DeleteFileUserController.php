<?php

namespace App\Http\Controllers\API\User;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Models\Document;
use App\Http\Controllers\API\BaseController as BaseController;

class DeleteFileUserController extends BaseController
{
     /**
     * Xóa tài liệu đã tải lên.
     */
    public function deleteFile($id)
    {
        $user = Auth::user();
        $document = Document::find($id);

        if (!$document) {
            return response()->json([
                'status' => false,
                'message' => 'Document not found'
            ], 404);
        }
        
        if ($document->user_id !== $user->id) {
            return response()->json([
                'status' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        // Xoá file vật lý nếu tồn tại
        $filePath = 'public/user_file/' . $document->files;
        if (Storage::exists($filePath)) {
            Storage::delete($filePath);
        }

        // Xoá bản ghi trong database
        $document->delete();

        return response()->json([
            'status' => true,
            'message' => 'Document deleted successfully'
        ]);
    }
}
