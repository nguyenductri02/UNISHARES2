<?php

namespace App\Http\Controllers\API\Post;

use App\Http\Controllers\Controller;
use App\Models\PostAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class PostAttachmentController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Get the download URL for a post attachment
     * 
     * @param Request $request
     * @param int $id Attachment ID
     * @return \Illuminate\Http\JsonResponse
     */
    public function getFileUrl(Request $request, $id)
    {
        try {
            $attachment = PostAttachment::findOrFail($id);
            
            // Generate file URL based on storage location
            $fileUrl = null;
            
            if ($attachment->fileUpload) {
                $fileUrl = $attachment->fileUpload->getPublicUrl();
            } else if ($attachment->file_path) {
                // Direct file path handling
                if (strpos($attachment->file_path, 'public/') === 0) {
                    $fileUrl = url('storage/' . str_replace('public/', '', $attachment->file_path));
                } else {
                    // Remove private/ prefix if it exists
                    $path = $attachment->file_path;
                    if (strpos($path, 'private/') === 0) {
                        $path = substr($path, 8);
                    }
                    $fileUrl = url('/api/storage/file/' . $path);
                }
            }
            
            if (!$fileUrl) {
                return response()->json([
                    'success' => false,
                    'message' => 'File URL not available'
                ], 404);
            }
            
            // Remove 'private/' prefix for download URL
            $downloadPath = $attachment->file_path;
            if (strpos($downloadPath, 'private/') === 0) {
                $downloadPath = substr($downloadPath, 8);
            }
            
            return response()->json([
                'success' => true,
                'url' => $fileUrl,
                'download_url' => url('/api/storage/download/' . $downloadPath),
                'file_name' => $attachment->file_name
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting file URL: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error getting file URL: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download a post attachment
     * 
     * @param Request $request
     * @param int $id Attachment ID
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse|\Illuminate\Http\JsonResponse
     */
    public function download(Request $request, $id)
    {
        try {
            $attachment = PostAttachment::findOrFail($id);
            
            // Check if file exists
            if (!$attachment->file_path) {
                return response()->json([
                    'success' => false,
                    'message' => 'File path not found'
                ], 404);
            }
            
            // Remove 'private/' prefix if present
            $path = $attachment->file_path;
            if (strpos($path, 'private/') === 0) {
                $path = substr($path, 8);
            }
            
            // Redirect to the storage controller for handling the download
            return redirect('/api/storage/download/' . $path);
        } catch (\Exception $e) {
            Log::error('Error downloading attachment: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error downloading attachment: ' . $e->getMessage()
            ], 500);
        }
    }
}
