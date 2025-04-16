<?php

namespace App\Http\Controllers\API\User;

use App\Models\User;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\API\BaseController as BaseController;

class UploadFileUserController extends BaseController
{
    //  /**
    //  * tải tài liệu lên
    //  */
    public function filesUpload(Request $req, $id)
    {
        $currentUser = Auth::user();
        $user = User::find($id);

        if (!$user) {
            return $this->sendError('User not found', [], 404);
        }

        if ($currentUser->id !== $user->id) {
            return response()->json(['status' => false, 'message' => 'Unauthorized'], 403);
        }

        if ($req->hasFile('files')) {
            $file = $req->file('files');
            $originalName = $file->getClientOriginalName();
            $nameWithoutExt = pathinfo($originalName, PATHINFO_FILENAME);
            $extension = $file->getClientOriginalExtension();
            $newFileName = time() . '_' . str_replace(' ', '_', $nameWithoutExt) . '.' . $extension;
            
            $file->storeAs('public/user_file', $newFileName);
            
            $document = Document::create([
                'title' => $req->input('title', $nameWithoutExt),
                'description' => $req->input('description'),
                'files' => $newFileName,
                'user_id' => $user->id,
                'subject' => $req->input('subject'),
                'university' => $req->input('university'),
                'is_official' => false,
                'status' => '1',
                'download_count' => 0,
                'rating' => 0,
                'rating_count' => 0,
            ]);

            return response()->json([
                'status' => true,
                'message' => 'File uploaded successfully',
                'document' => $document,
                'file_url' => asset('storage/user_file/' . $newFileName)
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'No file uploaded'
        ], 400);
    }
}
