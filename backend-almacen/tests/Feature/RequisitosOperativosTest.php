<?php

namespace Tests\Feature;

use App\Http\Requests\StoreProyectoRequest;
use App\Models\MovimientoInventario;
use App\Models\Usuario;
use App\Services\InventarioService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class RequisitosOperativosTest extends TestCase
{
    public function test_existen_los_cinco_roles_requeridos(): void
    {
        $this->assertSame(['Admin', 'Almacen', 'Proyecto', 'Solicitante', 'Direccion'], Usuario::ROLES);
    }

    public function test_proyecto_exige_responsable(): void
    {
        $request = new StoreProyectoRequest();
        $this->assertContains('required', $request->rules()['responsable_id']);
        $this->assertContains('required', $request->rules()['cliente_nombre']);
        $this->assertContains('required', $request->rules()['estatus']);
    }

    public function test_movimientos_incluyen_todos_los_tipos_formales(): void
    {
        $this->assertContains(MovimientoInventario::TIPO_TRANSFERENCIA, MovimientoInventario::TIPOS_FORMALES);
        $this->assertContains(MovimientoInventario::TIPO_ASIGNACION, MovimientoInventario::TIPOS_FORMALES);
        $this->assertContains(MovimientoInventario::TIPO_CAMBIO_ESTADO, MovimientoInventario::TIPOS_FORMALES);
        $this->assertContains(MovimientoInventario::TIPO_CAMBIO_RESPONSABLE, MovimientoInventario::TIPOS_FORMALES);
        $this->assertContains(MovimientoInventario::TIPO_ENVIO_REPARACION, MovimientoInventario::TIPOS_FORMALES);
        $this->assertContains(MovimientoInventario::TIPO_RETORNO_REPARACION, MovimientoInventario::TIPOS_FORMALES);
        $this->assertContains(MovimientoInventario::TIPO_BAJA_LOGICA, MovimientoInventario::TIPOS_FORMALES);
    }

    public function test_no_se_permite_stock_negativo(): void
    {
        $stock = DB::table('stock_general')->whereNull('deleted_at')->first();
        if (! $stock) {
            $this->markTestSkipped('No existe stock de prueba.');
        }

        $this->expectException(ValidationException::class);
        app(InventarioService::class)->incrementarStock((int) $stock->articulo_id, -((float) $stock->cantidad + 1), $stock->ubicacion, $stock->ubicacion_id ?? null);
    }
}
