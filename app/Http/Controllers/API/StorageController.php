<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\Document;
use App\Models\FileUpload;
use App\Models\PostAttachment;

class StorageController extends Controller
{
    /**
     * Get a file from storage with authentication
     */    public function getFile(Request $request, $path)
    {
        // Check if user is authenticated through session or token in URL
        // This allows direct file access with a token
        if (!Auth::check() && !$this->validateRequestToken($request)) {
            return response()->json([
                'error' => 'Unauthenticated', 
                'message' => 'You must be logged in to access this file'
            ], 401);
        }
        
        // Normalize the path by removing any leading slashes
        $path = ltrim($path, '/');
        
        // Get the full path based on the relative path, without adding extra 'private/' prefix
        if (strpos($path, 'public/') === 0) {
            // Public storage
            $fullPath = storage_path('app/' . $path);
        } else if (strpos($path, 'private/') === 0) {
            // If path already starts with 'private/', use it directly
            $fullPath = storage_path('app/' . $path);
        } else if (strpos($path, 'uploads/') === 0) {
            // If path starts with 'uploads/', add 'private/' prefix once
            $fullPath = storage_path('app/private/' . $path);
        } else {
            // For other paths, add 'private/' prefix
            $fullPath = storage_path('app/private/' . $path);
        }
        
        Log::info('File access request', [
            'path' => $path,
            'fullPath' => $fullPath,
            'user_id' => Auth::id()
        ]);
        
        if (!File::exists($fullPath)) {
            Log::warning('File not found', ['path' => $path, 'fullPath' => $fullPath]);
            return response()->json(['error' => 'File not found'], 404);
        }
        
        // Check access permissions based on file type and location
        $canAccess = $this->checkFileAccess($request->user(), $path);
        
        if (!$canAccess) {
            Log::warning('Unauthorized file access attempt', [
                'path' => $path, 
                'user_id' => Auth::id()
            ]);
            return response()->json(['error' => 'Unauthorized access'], 403);
        }
        
        $mimeType = File::mimeType($fullPath);
        $contents = File::get($fullPath);
        
        // Set a more descriptive filename for the browser
        $fileName = $this->getDisplayFilename($path);
        
        return response($contents, 200)
            ->header('Content-Type', $mimeType)
            ->header('Content-Disposition', 'inline; filename="' . $fileName . '"');
    }
    
    /**
     * Preview a file (typically for documents)
     */
    public function previewFile(Request $request, $path)
    {
        // Normalize the path
        $path = ltrim($path, '/');
        
        // Get the full path based on the relative path
        if (strpos($path, 'public/') === 0) {
            // Public storage
            $fullPath = storage_path('app/' . $path);
        } else if (strpos($path, 'private/') === 0) {
            // If path already starts with 'private/', use it directly
            $fullPath = storage_path('app/' . $path);
        } else if (strpos($path, 'uploads/') === 0) {
            // If path starts with 'uploads/', add 'private/' prefix once
            $fullPath = storage_path('app/private/' . $path);
        } else {
            // For other paths, add 'private/' prefix
            $fullPath = storage_path('app/private/' . $path);
        }
        
        if (!File::exists($fullPath)) {
            Log::warning('Preview file not found', ['path' => $path, 'fullPath' => $fullPath]);
            return response()->json(['error' => 'File not found'], 404);
        }
        
        $mimeType = File::mimeType($fullPath);
        
        // For security, we only preview certain file types
        $previewableMimeTypes = [
            'application/pdf',
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
            'text/plain', 'text/html', 'text/css', 'text/javascript'
        ];
        
        if (!in_array($mimeType, $previewableMimeTypes)) {
            Log::warning('File type not previewable', ['path' => $path, 'mime_type' => $mimeType]);
            return response()->json(['error' => 'File type not previewable'], 403);
        }
        
        $contents = File::get($fullPath);
        
        // Set a more descriptive filename for the browser
        $fileName = $this->getDisplayFilename($path);
        
        return response($contents, 200)
            ->header('Content-Type', $mimeType)
            ->header('Content-Disposition', 'inline; filename="' . $fileName . '"');
    }
    
    /**
     * Download a file with proper Content-Disposition header
     */    public function downloadFile(Request $request, $path)
    {
        // Check if user is authenticated through session or token in URL
        // This allows direct file access with a token
        if (!Auth::check() && !$this->validateRequestToken($request)) {
            return response()->json([
                'error' => 'Unauthenticated', 
                'message' => 'You must be logged in to download this file'
            ], 401);
        }
        
        // Normalize the path
        $path = ltrim($path, '/');
        
        // Get the full path based on the relative path
        if (strpos($path, 'public/') === 0) {
            // Public storage
            $fullPath = storage_path('app/' . $path);
        } else if (strpos($path, 'private/') === 0) {
            // If path already starts with 'private/', use it directly
            $fullPath = storage_path('app/' . $path);
        } else if (strpos($path, 'uploads/') === 0) {
            // If path starts with 'uploads/', add 'private/' prefix once
            $fullPath = storage_path('app/private/' . $path);
        } else {
            // For other paths, add 'private/' prefix
            $fullPath = storage_path('app/private/' . $path);
        }
        
        if (!File::exists($fullPath)) {
            Log::warning('Download file not found', ['path' => $path, 'fullPath' => $fullPath]);
            return response()->json(['error' => 'File not found'], 404);
        }
        
        // Check access permissions
        $canAccess = $this->checkFileAccess($request->user(), $path);
        
        if (!$canAccess) {
            Log::warning('Unauthorized file download attempt', [
                'path' => $path, 
                'user_id' => Auth::id()
            ]);
            return response()->json(['error' => 'Unauthorized access'], 403);
        }
        
        // Get a more descriptive filename for download
        $fileName = $this->getDisplayFilename($path);
        $mimeType = File::mimeType($fullPath);
        
        // Increment download count if it's a document
        $this->incrementDownloadCount($path);
        
        return response()->download($fullPath, $fileName, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"'
        ]);
    }
    
    /**
     * Check if a user can access a file
     */
    private function checkFileAccess($user, $path)
    {
        // Admin and moderators can access all files
        if ($user->hasRole(['admin', 'moderator'])) {
            return true;
        }
        
        // Public files are accessible to all authenticated users
        if (strpos($path, 'public/') === 0) {
            return true;
        }
        
        // Normalize path for comparisons - remove 'private/' prefix if it exists
        $normalizedPath = $path;
        if (strpos($normalizedPath, 'private/') === 0) {
            $normalizedPath = substr($normalizedPath, 8); // Remove 'private/' prefix
        }
        
        // For post attachments - search with all possible path variations
        if (strpos($normalizedPath, 'uploads/') === 0 && strpos($normalizedPath, 'post_attachment') !== false) {
            // Find the attachment by file path - try both with and without private/ prefix
            $attachment = PostAttachment::where(function($query) use ($path, $normalizedPath) {
                $query->where('file_path', $path)
                      ->orWhere('file_path', 'private/' . $normalizedPath)
                      ->orWhere('file_path', $normalizedPath);
            })->first();
                
            if ($attachment) {
                // Owner can access
                if ($attachment->post->user_id === $user->id) {
                    return true;
                }
                
                // Group members can access group post attachments
                if ($attachment->post->group_id) {
                    $groupMember = $user->groups()
                        ->where('group_id', $attachment->post->group_id)
                        ->exists();
                    
                    if ($groupMember) {
                        return true;
                    }
                }
            }
        }
        
        // For documents - search with all possible path variations
        if (strpos($normalizedPath, 'uploads/') === 0 && strpos($normalizedPath, 'document') !== false) {
            // Try to find the document by path - try both with and without private/ prefix
            $document = Document::where(function($query) use ($path, $normalizedPath) {
                $query->where('file_path', $path)
                      ->orWhere('file_path', 'private/' . $normalizedPath)
                      ->orWhere('file_path', $normalizedPath);
            })->first();
                
            if ($document) {
                // Document owner can access
                if ($document->user_id === $user->id) {
                    return true;
                }
                
                // Approved documents are accessible to all
                if ($document->is_approved) {
                    return true;
                }
                
                // Group documents are accessible to group members
                if ($document->group_id) {
                    $groupMember = $user->groups()
                        ->where('group_id', $document->group_id)
                        ->exists();
                    
                    if ($groupMember) {
                        return true;
                    }
                }
            }
        }
        
        // Check if the file is associated with a FileUpload record
        $fileUpload = FileUpload::where(function($query) use ($path, $normalizedPath) {
            $query->where('file_path', $path)
                  ->orWhere('file_path', 'private/' . $normalizedPath)
                  ->orWhere('file_path', $normalizedPath);
        })->first();
            
        if ($fileUpload) {
            // Owner can access their own files
            if ($fileUpload->user_id === $user->id) {
                return true;
            }
            
            // If it's a completed upload and associated with a public resource
            if ($fileUpload->status === 'completed' && $fileUpload->uploadable_type) {
                if ($fileUpload->uploadable_type === 'document') {
                    $document = $fileUpload->uploadable;
                    if ($document && $document->is_approved) {
                        return true;
                    }
                }
            }
        }
        
        // By default, deny access
        return false;
    }
    
    /**
     * Try to get a more descriptive filename for the browser
     */
    private function getDisplayFilename($path)
    {
        // Default to the basename of the path
        $fileName = basename($path);
        
        // Normalize path
        $normalizedPath = $path;
        if (strpos($normalizedPath, 'private/') === 0) {
            $normalizedPath = substr($normalizedPath, 8);
        }
        
        // For post attachments
        $attachment = PostAttachment::where(function($query) use ($path, $normalizedPath) {
            $query->where('file_path', $path)
                  ->orWhere('file_path', 'private/' . $normalizedPath)
                  ->orWhere('file_path', $normalizedPath);
        })->first();
            
        if ($attachment && $attachment->file_name) {
            return $attachment->file_name;
        }
        
        // For documents
        $document = Document::where(function($query) use ($path, $normalizedPath) {
            $query->where('file_path', $path)
                  ->orWhere('file_path', 'private/' . $normalizedPath)
                  ->orWhere('file_path', $normalizedPath);
        })->first();
            
        if ($document && $document->file_name) {
            return $document->file_name;
        }
        
        // For file uploads
        $fileUpload = FileUpload::where(function($query) use ($path, $normalizedPath) {
            $query->where('file_path', $path)
                  ->orWhere('file_path', 'private/' . $normalizedPath)
                  ->orWhere('file_path', $normalizedPath);
        })->first();
            
        if ($fileUpload && $fileUpload->original_filename) {
            return $fileUpload->original_filename;
        }
        
        return $fileName;
    }
    
    /**
     * Increment download count for documents
     */    /**
     * Validate a token passed in the request query string
     * 
     * @param Request $request
     * @return bool
     */
    private function validateRequestToken(Request $request)
    {
        $token = $request->query('token');
        
        if (!$token) {
            return false;
        }
        
        // Find the token in the database
        $personalAccessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
        
        if (!$personalAccessToken) {
            return false;
        }
        
        // Get the user associated with the token and auth them
        $user = $personalAccessToken->tokenable;
        if ($user) {
            Auth::login($user);
            return true;
        }
        
        return false;
    }

    private function incrementDownloadCount($path)
    {
        // Normalize path
        $normalizedPath = $path;
        if (strpos($normalizedPath, 'private/') === 0) {
            $normalizedPath = substr($normalizedPath, 8);
        }
        
        $document = Document::where(function($query) use ($path, $normalizedPath) {
            $query->where('file_path', $path)
                  ->orWhere('file_path', 'private/' . $normalizedPath)
                  ->orWhere('file_path', $normalizedPath);
        })->first();
            
        if ($document) {
            $document->increment('download_count');
        }
    }
}
