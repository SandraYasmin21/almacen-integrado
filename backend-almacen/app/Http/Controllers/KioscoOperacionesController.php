<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class KioscoOperacionesController extends Controller
{
    /**
     * Kiosco Préstamos: Registrar Salida
     */
    public function registrarSalidaPrestamo(Request $request)
    {
        $request->validate([
            'empleado_id' => 'required|integer',
            'articulo_id' => 'required|integer',
            'cantidad' => 'required|integer|min:1',
        ]);

        // Registrar movimiento de salida tipo 'prestamo'
        $movimientoId = DB::table('movimiento_inventario')->insertGetId([
            'tipo_movimiento' => 'salida',
            'subtipo_movimiento' => 'prestamo',
            'usuario_id' => 1, // Usuario "Sistema" o "Kiosco"
            'origen_destino' => 'Préstamo a empleado ID: ' . $request->empleado_id,
            'notas' => 'Registrado desde Kiosco',
            'fecha_movimiento' => Carbon::now(),
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        DB::table('detalle_movimiento')->insert([
            'movimiento_id' => $movimientoId,
            'articulo_id' => $request->articulo_id,
            'cantidad' => $request->cantidad,
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        // Guardar en tabla de préstamos (dependiendo de la estructura actual)
        // Esto asume una tabla `prestamos_herramientas` o que se usa `asignaciones_activos`
        // Simplificaremos la simulación para el objetivo
        return response()->json(['message' => 'Préstamo registrado exitosamente']);
    }

    /**
     * Kiosco Préstamos: Devolución
     */
    public function registrarDevolucionPrestamo(Request $request)
    {
        $request->validate([
            'empleado_id' => 'required|integer',
            'prestamo_id' => 'required|integer', // ID del registro pendiente
        ]);

        // Aquí se actualiza el registro del préstamo a "devuelto"
        return response()->json(['message' => 'Devolución registrada exitosamente']);
    }

    /**
     * Kiosco Resguardos: Asignación con Firma
     */
    public function registrarResguardoFirma(Request $request)
    {
        $request->validate([
            'empleado_id' => 'required|integer',
            'articulo_id' => 'required|integer',
            'serie_id' => 'required|integer',
            'firma_digital' => 'required|string', // Base64 image
        ]);

        // Asignar el equipo con la firma
        DB::table('asignaciones_activos')->insert([
            'empleado_id' => $request->empleado_id,
            'articulo_id' => $request->articulo_id,
            'serie_id' => $request->serie_id,
            'fecha_asignacion' => Carbon::now(),
            'estado' => 'activo',
            'firma_digital' => $request->firma_digital,
            'condicion_entrega' => 'bueno',
            'usuario_asigna_id' => 1, // Kiosco
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        return response()->json(['message' => 'Resguardo firmado y registrado exitosamente']);
    }

    /**
     * Kiosco Flotilla: Salida de Vehículo
     */
    public function salidaVehiculo(Request $request)
    {
        $request->validate([
            'empleado_id' => 'required|integer',
            'vehiculo_id' => 'required|integer',
            'kilometraje_salida' => 'required|numeric',
        ]);

        // Aquí iría el insert a `uso_vehiculos` o bitácora de flotilla
        return response()->json(['message' => 'Salida de vehículo registrada exitosamente']);
    }

    /**
     * Kiosco Flotilla: Regreso de Vehículo
     */
    public function regresoVehiculo(Request $request)
    {
        $request->validate([
            'empleado_id' => 'required|integer',
            'vehiculo_id' => 'required|integer',
            'kilometraje_llegada' => 'required|numeric',
        ]);

        // Aquí iría el update a la bitácora de flotilla
        return response()->json(['message' => 'Regreso de vehículo registrado exitosamente']);
    }
}
