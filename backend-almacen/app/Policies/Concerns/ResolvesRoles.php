<?php

namespace App\Policies\Concerns;

use App\Models\Usuario;

trait ResolvesRoles
{
    public function before(Usuario $user, string $ability): ?bool
    {
        return $user->isAdmin() ? true : null;
    }

    protected function any(Usuario $user, string ...$roles): bool
    {
        return $user->hasRole(...$roles);
    }
}
