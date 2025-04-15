<?php

namespace App\Http\Controllers\API\User;

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\API\BaseController as BaseController;

class UpdateProfileUserController extends BaseController
{
    /**
     * chỉnh sửa hồ sơ cá nhân.
     */
    public function updateUser(Request $request, $id)
    {
        $currentUser = Auth::user(); // ktra quyen

        $user = User::find($id);
        if (!$user) {
            return $this->sendError('User not found', [], 404);
        }

        if ($currentUser->id != $id ) {
            return $this->sendError(
                'Unauthorized',
                ['error' => 'You can only update your own information'],
                403
            );
        }

        $validator = Validator::make($request->all(), [
            'full_name'          => 'sometimes|required',
            'password'           => 'sometimes|min:6',
            'phone'              => "sometimes|digits:10|unique:users,phone,{$id}",
            'address'            => 'nullable|string|max:255',
            'dob'                => 'nullable|string|max:255',
            'gender'                => 'nullable|string|max:255',
            
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation failed', $validator->errors(), 400);
        }

        $updateData = $request->except(['password', 'avatar']);

        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        $user->update($updateData);

        return $this->sendResponse($user, 'User updated successfully');
    }

}
