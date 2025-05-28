<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class GroupResource extends JsonResource
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
            'name' => $this->name,
            'description' => $this->description,
            'avatar' => $this->avatar ? url('storage/' . $this->avatar) : null,
            'cover_image' => $this->cover_image ? url('storage/' . $this->cover_image) : null,
            'type' => $this->type,
            'course_code' => $this->course_code,
            'university' => $this->university,
            'department' => $this->department,
            'requires_approval' => $this->requires_approval,
            'member_count' => $this->member_count ?? $this->members()->count(),
            'creator' => $this->whenLoaded('creator', function () {
                return [
                    'id' => $this->creator->id,
                    'name' => $this->creator->name,
                    'avatar' => $this->creator->avatar ? (strpos($this->creator->avatar, 'http') === 0 ? $this->creator->avatar : url('storage/' . $this->creator->avatar)) : null,
                ];
            }),
            // Include the user's role in this group (added dynamically)
            'role' => $this->when(isset($this->role), $this->role),
            // Include joined date (added dynamically)
            'joined_at' => $this->when(isset($this->joined_at), function () {
                return $this->joined_at ? $this->joined_at->toIso8601String() : null;
            }),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
