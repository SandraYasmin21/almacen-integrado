<?php

namespace App\Policies;

use App\Models\Usuario;
use App\Policies\Concerns\ResolvesRoles;

class InventarioSeriePolicy
{
    use ResolvesRoles;

    public function viewAny(Usuario $user): bool { return $this->any($user, Usuario::ROL_ALMACEN, Usuario::ROL_PROYECTO, Usuario::ROL_DIRECCION); }
    public function view(Usuario $user): bool { return $this->viewAny($user); }
    public function create(Usuario $user): bool { return $this->any($user, Usuario::ROL_ALMACEN); }
    public function update(Usuario $user): bool { return $this->any($user, Usuario::ROL_ALMACEN); }
    public function delete(Usuario $user): bool { return false; }
    public function restore(Usuario $user): bool { return false; }
}
