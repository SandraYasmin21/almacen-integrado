<?php

namespace App\Policies;

use App\Models\Usuario;
use App\Policies\Concerns\ResolvesRoles;

class ReportePolicy
{
    use ResolvesRoles;

    public function viewAny(Usuario $user): bool { return $this->any($user, Usuario::ROL_ALMACEN, Usuario::ROL_PROYECTO, Usuario::ROL_DIRECCION); }
    public function export(Usuario $user): bool { return $this->any($user, Usuario::ROL_ALMACEN, Usuario::ROL_DIRECCION); }
    public function backup(Usuario $user): bool { return false; }
}
