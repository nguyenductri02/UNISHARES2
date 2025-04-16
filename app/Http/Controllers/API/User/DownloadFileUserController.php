<?php

namespace App\Http\Controllers\API\User;

use App\Models\Document;
use Illuminate\Support\Facades\Response;
use App\Http\Controllers\API\BaseController as BaseController;

class DownloadFileUserController extends BaseController
{
    //  /**
    //  * tải xuống tài liệu
    //  */
    public function downloadFile($filename)
    {
        $path = storage_path('app/public/user_file/' . $filename);

        if (!file_exists($path)) {
            return response()->json([
                'status' => false,
                'message' => 'File not found'
            ], 404);
        }

        // Tăng lượt download nếu có bản ghi trong bảng documents
        $document = Document::where('files', $filename)->first();
        if ($document) {
            $document->increment('download_count');
        }

        $file = file_get_contents($path);
        $mimeType = mime_content_type($path);

        return Response::make($file, 200, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'attachment; filename="' . $filename . '"'
        ]);
    }
}
