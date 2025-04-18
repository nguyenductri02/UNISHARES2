<?php

namespace App\Http\Controllers\API\User;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Http\Controllers\API\BaseController as BaseController;

class UploadPictureUserController extends BaseController
{
     /**
     * upload avatar user.
     */
    public function avatarUpload(Request $req, $id)
    {
        $currentUser = Auth::user();// lấy thông tin người dùng đang nhập
        $user = User::find($id);
        
        if (!$user) {
            return $this->sendError('User not found', [], 404);
        }
        
        if ($currentUser->id !== $user->id) {
            return response()->json(['status' => false, 'message' => 'Unauthorized'], 403);
        }

        if ($req->hasFile('avatar')) {
            $file = $req->file('avatar');
            $originalName = $file->getClientOriginalName();// lấy tên file gốc
            $nameWithoutExt = pathinfo($originalName, PATHINFO_FILENAME);// bỏ đoạn mở rộng
            $extension = $file->getClientOriginalExtension();// lấy pnj
            $newFileName = time() . '_' . str_replace(' ', '_', $nameWithoutExt) . '.' . $extension;

            $file->storeAs('public/user_img', $newFileName);

            $updateData = ['avatar' => $newFileName];
            $user->update($updateData);

            return response()->json([
                'status' => true,
                'message' => 'Avatar uploaded successfully',
                'avatar_url' => asset('storage/user_img/' . $newFileName)
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'No avatar file uploaded'
        ], 400);
    }

}
