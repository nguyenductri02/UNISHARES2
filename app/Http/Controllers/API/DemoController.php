<?php

namespace App\Http\Controllers\API;

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class DemoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
    
}




















































// public function getUsers()
//     {
//         $users = User::count() > 5 ? User::paginate(5) : User::all();
//         return response()->json($users);
//     }
    
//     public function searchUser(Request $request)
//     {
//         $request->validate([
//             'user_name' => 'required|string'
//         ]);

//         $users = User::where('user_name', 'LIKE', '%' . $request->user_name . '%')->get();

//         return response()->json($users);
//     }