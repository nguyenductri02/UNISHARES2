<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  Request  $request
     * @return array
     */
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'file_name' => $this->file_name,
            'file_type' => $this->file_type,
            'file_size' => $this->file_size,
            'file_hash' => $this->file_hash,
            'file_path' => $this->file_path,
            'subject' => $this->subject,
            'course_code' => $this->course_code,
            'is_official' => $this->is_official,
            'is_approved' => $this->is_approved,
            'download_count' => $this->download_count,
            'view_count' => $this->view_count,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'deleted_at' => $this->deleted_at,
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                ];
            }),
            'ratings' => $this->whenLoaded('ratings', function () {
                return [
                    'average' => $this->ratings->avg('rating') ?? 0,
                    'count' => $this->ratings->count(),
                    'details' => RatingResource::collection($this->ratings),
                ];
            }),
            'comments' => $this->whenLoaded('comments', function () {
                return CommentResource::collection($this->comments);
            }),
            'categories' => $this->whenLoaded('categories', function () {
                return CategoryResource::collection($this->categories);
            }),
        ];
    }
}
