<?php

namespace Tests\Feature;

use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Tests\TestCase;

class ExportacionesTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): Usuario
    {
        return Usuario::create([
            'nombre_usuario' => 'export_admin',
            'email' => 'export@test.local',
            'password_hash' => Hash::make('Export123!'),
            'rol_acceso' => Usuario::ROL_ADMIN,
            'password_cambiado' => true,
            'activo' => true,
        ]);
    }

    public function test_exportaciones_pdf_y_excel_responden_archivos_validos(): void
    {
        ini_set('memory_limit', '512M');
        $this->actingAs($this->admin(), 'sanctum');

        $rutas = [
            '/api/export/pdf' => 'application/pdf',
            '/api/export/excel' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '/api/almacen/export/pdf' => 'application/pdf',
            '/api/almacen/export/excel' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '/api/almacen/exportar-inventario?formato=pdf' => 'application/pdf',
            '/api/almacen/exportar-inventario?formato=excel' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '/api/almacen/ordenes-compra/export/pdf' => 'application/pdf',
            '/api/almacen/ordenes-compra/export/excel' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '/api/catalogo/export/articulos/pdf' => 'application/pdf',
            '/api/catalogo/export/articulos/excel' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '/api/catalogo/export/vehiculos/pdf' => 'application/pdf',
            '/api/catalogo/export/vehiculos/excel' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '/api/exportar/mantenimientos/pdf' => 'application/pdf',
            '/api/exportar/mantenimientos/excel' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '/api/exportar/gastosextra/pdf' => 'application/pdf',
            '/api/exportar/gastosextra/excel' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '/api/exportar/kilometraje/pdf' => 'application/pdf',
            '/api/exportar/kilometraje/excel' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '/api/exportar/bitacora/pdf' => 'application/pdf',
            '/api/exportar/bitacora/excel' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '/api/reportes/basicos/movimientos/export?format=pdf' => 'application/pdf',
            '/api/reportes/basicos/movimientos/export?format=excel' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '/api/empleados/export/pdf?tipo=resguardos' => 'application/pdf',
            '/api/empleados/export/excel?tipo=resguardos' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '/api/empleados/export/pdf?tipo=prestamos' => 'application/pdf',
            '/api/empleados/export/excel?tipo=prestamos' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];

        foreach ($rutas as $ruta => $tipo) {
            $response = $this->get($ruta);
            $response->assertOk();
            $this->assertStringStartsWith($tipo, (string) $response->headers->get('content-type'), $ruta);
            if ($response->baseResponse instanceof BinaryFileResponse) {
                $this->assertGreaterThan(0, $response->baseResponse->getFile()->getSize(), $ruta);
            } else {
                $content = $response->baseResponse instanceof StreamedResponse
                    ? $response->streamedContent()
                    : $response->getContent();
                $this->assertNotEmpty($content, $ruta);
            }
            unset($response, $content);
            gc_collect_cycles();
        }
    }

    public function test_los_tres_formatos_de_entrega_generan_pdf(): void
    {
        foreach (['asignacion-equipo', 'hoja-entrega', 'prestamo-externo'] as $tipo) {
            $response = $this->postJson("/api/documentos-operacion/{$tipo}/pdf", [
                'fecha' => '2026-07-02',
                'recibe' => 'Persona de prueba',
                'entrega' => 'Responsable de almacen',
                'motivo' => 'Prueba automatizada',
                'items' => [[
                    'cantidad' => '1',
                    'equipo' => 'Laptop',
                    'modelo' => 'Prueba',
                    'serie' => 'TEST-001',
                    'unidad' => 'PZA',
                ]],
            ]);

            $response->assertOk();
            $this->assertStringStartsWith('application/pdf', (string) $response->headers->get('content-type'));
            $this->assertStringStartsWith('%PDF', $response->getContent());
        }
    }
}
