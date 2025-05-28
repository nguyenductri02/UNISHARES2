<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Report extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'reportable_type',
        'reportable_id',
        'reason',
        'details',
        'status',
        'resolved_by',
        'resolution_note',
        'resolved_at',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
    ];

    // Allow all reports to be visible to both admins and moderators
    protected static function booted()
    {
        static::addGlobalScope('visibleToModerators', function ($builder) {
            // No restriction for moderators or admins
            if (auth()->check() && (auth()->user()->hasRole('moderator') || auth()->user()->hasRole('admin'))) {
                return $builder;
            }
            
            // For other users, restrict to their own reports
            if (auth()->check()) {
                return $builder->where('user_id', auth()->id());
            }
            
            // No access for guests
            return $builder->whereRaw('1 = 0');
        });
    }

    /**
     * Get the user who reported.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the reportable item.
     */
    public function reportable()
    {
        return $this->morphTo();
    }

    /**
     * Get the user who resolved the report.
     */
    public function resolver()
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    /**
     * Override the toArray method to include reportable info if it exists
     */
    public function toArray()
    {
        $array = parent::toArray();
        
        // Include the short name of the reportable type for easier frontend processing
        if (!empty($this->reportable_type)) {
            $array['reportable_type_name'] = class_basename($this->reportable_type);
        }
        
        return $array;
    }

    /**
     * Scope query to only include pending reports.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope query to only include resolved reports.
     */
    public function scopeResolved($query)
    {
        return $query->where('status', 'resolved');
    }

    /**
     * Scope query to only include rejected reports.
     */
    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    /**
     * Mark report as resolved
     */
    public function resolve($user, $note = null)
    {
        $this->status = 'resolved';
        $this->resolved_by = $user->id;
        $this->resolution_note = $note;
        $this->resolved_at = now();
        $this->save();

        return $this;
    }

    /**
     * Mark report as rejected
     */
    public function reject($user, $note = null)
    {
        $this->status = 'rejected';
        $this->resolved_by = $user->id;
        $this->resolution_note = $note;
        $this->resolved_at = now();
        $this->save();

        return $this;
    }

    /**
     * Get reports for moderator dashboard - explicitly visible to moderators
     */
    public static function getForModerator()
    {
        return self::withoutGlobalScopes()->orderBy('created_at', 'desc');
    }
}
