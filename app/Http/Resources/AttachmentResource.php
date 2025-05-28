<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class AttachmentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
     */
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'post_id' => $this->post_id,
            'file_upload_id' => $this->file_upload_id,
            'name' => $this->name,
            'type' => $this->type,
            'size' => $this->size,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            
            // Add download URL
            'url' => $this->when($this->fileUpload, function () {
                return url('api/storage/file/' . $this->fileUpload->file_path);
            }),
            
            // Add preview URL for images
            'preview_url' => $this->when($this->fileUpload && strpos($this->type, 'image/') === 0, function () {
                return url('api/storage/preview/' . $this->fileUpload->file_path);
            }),
        ];
    }
}
