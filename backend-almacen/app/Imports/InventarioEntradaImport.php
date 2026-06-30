<?php

namespace App\Imports;

use Maatwebsite\Excel\Concerns\ToArray;

class InventarioEntradaImport implements ToArray
{
    public function array(array $array): array
    {
        return $array;
    }
}
