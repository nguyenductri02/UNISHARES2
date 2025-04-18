<?php

namespace App\Http\Controllers\API\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Document;

class RatingDocumentUserController extends Controller
{
    //  /**
    //  * xếp hạng documents.
    //  */
    public function rate(Request $request, $document_id)
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
            'rating' => 'required|integer|min:1|max:5'
        ]);

        $newRating = $request->input('rating');
       
        $totalRating = $document->rating * $document->rating_count;
        $totalRating += $newRating;
        $document->rating_count += 1;
        $document->rating = $totalRating / $document->rating_count;

        $document->save();

        return response()->json([
            'status' => true,
            'message' => 'Document rated successfully',
            'rating' => $document->rating,
            'rating_count' => $document->rating_count
        ]);
    }
    
}
