<?php

namespace App\Http\Middleware;

use Illuminate\Support\Facades\Facade;

/**
 * Facade for the role middleware
 */
class RoleFacade extends Facade
{
    /**
     * Get the registered name of the component.
     *
     * @return string
     */
    protected static function getFacadeAccessor()
    {
        return 'role';
    }
}
