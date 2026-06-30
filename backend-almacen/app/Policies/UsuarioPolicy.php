<?php

namespace App\Policies;

use App\Models\Usuario;
use App\Policies\Concerns\ResolvesRoles;

class UsuarioPolicy
{
    use ResolvesRoles;

    public function viewAny(Usuario $user): bool { return false; }
    public function view(Usuario $user): bool { return false; }
    public function create(Usuario $user): bool { return false; }
    public function update(Usuario $user): bool { return false; }
    public function delete(Usuario $user): bool { return false; }
}
