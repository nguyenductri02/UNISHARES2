<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PostCommentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'content' => $this->content,
            'parent_id' => $this->parent_id,
            'post_id' => $this->post_id,
            'user_id' => $this->user_id,
            'like_count' => $this->like_count,
            'replies_count' => $this->when($this->relationLoaded('replies'), function () {
                return $this->replies->count();
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'user' => new UserResource($this->whenLoaded('user')),
            'replies' => PostCommentResource::collection($this->whenLoaded('replies')),
            'is_liked' => $this->when(auth()->check(), function () {
                return $this->likes()->where('user_id', auth()->id())->exists();
            }, false),
        ];
    }
}
