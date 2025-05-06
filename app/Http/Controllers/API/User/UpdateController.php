<?php

namespace App\Http\Controllers\Api\User;

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\API\BaseController as BaseController;

class UpdateUsersController extends BaseController
{
     public function updateUser(Request $request, $id)
    {
        $currentUser = Auth::user(); // ktra quyen

        $user = User::find($id);
        if (!$user) {
            return $this->sendError('User not found', [], 404);
        }
        
        // if ($currentUser->id != $id && $currentUser->role != 2) {
        if ($currentUser->id != $id ) {
            return $this->sendError(
                'Unauthorized',
                ['error' => 'You can only update your own information'],
                403
            );
        }

        $validator = Validator::make($request->all(), [
            'user_name'          => 'sometimes|required',
            'email'              => "sometimes|email|unique:users,email,{$id}",
            'password'           => 'sometimes|min:6',
            'phone'              => "sometimes|digits:10|unique:users,phone,{$id}",
            'address'            => 'nullable|string|max:255',
            'full_name'          => 'nullable|string|max:255',
            'university'         => 'nullable|string|max:255',
            'major'              => 'nullable|string|max:255',
            'profile_picture_url'=> 'nullable|url',
            'avatar'             => 'nullable|image|max:2048'
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation failed', $validator->errors(), 400);
        }

        $updateData = $request->except(['password', 'avatar']);

        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        if ($request->hasFile('avatar')) {
            $updateData['avatar'] = $request->file('avatar')->store('avatars', 'public');
        }

        $user->update($updateData);

        return $this->sendResponse($user, 'User updated successfully');
    }
}