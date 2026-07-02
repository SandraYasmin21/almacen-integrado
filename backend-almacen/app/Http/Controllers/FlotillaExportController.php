<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Exports\GenericExport;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class FlotillaExportController extends Controller
{
    public function mantenimientos(Request $request, $formato)
    {
        $query = DB::table('registros_vehiculares as rv')
            ->join('vehiculos_flotilla as v', 'rv.vehiculo_id', '=', 'v.id')
            ->whereNull('rv.deleted_at')
            ->select(
                'v.nombre as vehiculo',
                'rv.fecha',
                'rv.tipo',
                'rv.tipo_mantenimiento as subtipo',
                'rv.kilometraje',
                'rv.costo',
                'rv.detalle_falla'
            )
            ->orderByDesc('rv.fecha');

        if ($request->filled('vehiculo_id')) {
            $query->where('rv.vehiculo_id', $request->vehiculo_id);
        }
        if ($request->filled('tipo')) {
            $query->where('rv.tipo', $request->tipo);
        }
        
        $data = $query->get()->map(function($item) {
            return [
                'vehiculo' => $item->vehiculo,
                'fecha' => Carbon::parse($item->fecha)->format('d/m/Y'),
                'tipo' => ucfirst($item->tipo),
                'subtipo' => $item->subtipo ?: '-',
                'kilometraje' => number_format($item->kilometraje, 2),
                'costo' => '$' . number_format($item->costo, 2),
                'detalle' => $item->detalle_falla ?: '-'
            ];
        });

        $headings = ['Vehículo', 'Fecha', 'Tipo', 'Subtipo', 'Kilometraje', 'Costo', 'Detalle'];
        return $this->generarArchivo('Mantenimientos_Vehiculares', $data, $headings, $formato);
    }

    public function gastosextra(Request $request, $formato)
    {
        $query = DB::table('gastos_extra_vehiculos as g')
            ->join('vehiculos_flotilla as v', 'g.vehiculo_id', '=', 'v.id')
            ->whereNull('g.deleted_at')
            ->select(
                'v.nombre as vehiculo',
                'g.fecha',
                'g.tipo',
                'g.costo',
                'g.observaciones'
            )
            ->orderByDesc('g.fecha');

        if ($request->filled('vehiculo_id')) {
            $query->where('g.vehiculo_id', $request->vehiculo_id);
        }
        if ($request->filled('categoria')) {
            $query->where('g.tipo', $request->categoria);
        }

        $data = $query->get()->map(function($item) {
            return [
                'vehiculo' => $item->vehiculo,
                'fecha' => Carbon::parse($item->fecha)->format('d/m/Y'),
                'categoria' => ucfirst($item->tipo),
                'costo' => '$' . number_format($item->costo, 2),
                'descripcion' => $item->observaciones ?: '-'
            ];
        });

        $headings = ['Vehículo', 'Fecha', 'Categoría', 'Costo', 'Descripción'];
        return $this->generarArchivo('Gastos_Extra', $data, $headings, $formato);
    }

    public function kilometraje(Request $request, $formato)
    {
        $data = DB::table('vehiculos_flotilla')
            ->whereNull('deleted_at')
            ->select('nombre as vehiculo', 'placa', 'kilometraje_actual', 'updated_at')
            ->orderBy('nombre')
            ->get()->map(function($item) {
                return [
                    'vehiculo' => $item->vehiculo,
                    'placa' => $item->placa ?: '-',
                    'kilometraje' => number_format((float)$item->kilometraje_actual, 2),
                    'ultima_actualizacion' => Carbon::parse($item->updated_at)->format('d/m/Y H:i')
                ];
            });

        $headings = ['Vehículo', 'Placa', 'Kilometraje', 'Última Actualización'];
        return $this->generarArchivo('Kilometraje', $data, $headings, $formato);
    }

    public function bitacora(Request $request, $formato)
    {
        $query = DB::table('bitacora_vehiculos as b')
            ->join('vehiculos_flotilla as v', 'b.vehiculo_id', '=', 'v.id')
            ->leftJoin('empleados as e', 'b.empleado_id', '=', 'e.id')
            ->whereNull('b.deleted_at')
            ->select(
                'v.nombre as vehiculo',
                DB::raw("'Sin proyecto' as proyecto"),
                'e.nombre_completo as conductor',
                'b.fecha_hora_salida',
                'b.km_inicial as km_salida',
                'b.fecha_hora_regreso',
                'b.km_final as km_regreso'
            )
            ->orderByDesc('b.fecha_hora_salida');

        if ($request->filled('vehiculo_id')) {
            $query->where('b.vehiculo_id', $request->vehiculo_id);
        }

        $data = $query->get()->map(function($item) {
            $distancia = ($item->km_regreso && $item->km_salida) ? ($item->km_regreso - $item->km_salida) : 0;
            return [
                'vehiculo' => $item->vehiculo,
                'proyecto' => $item->proyecto ?: 'Sin proyecto',
                'conductor' => $item->conductor ?: '-',
                'salida' => Carbon::parse($item->fecha_hora_salida)->format('d/m/Y H:i'),
                'km_salida' => number_format($item->km_salida, 2),
                'regreso' => $item->fecha_hora_regreso ? Carbon::parse($item->fecha_hora_regreso)->format('d/m/Y H:i') : 'En ruta',
                'km_regreso' => $item->km_regreso ? number_format($item->km_regreso, 2) : '-',
                'distancia' => number_format($distancia, 2)
            ];
        });

        $headings = ['Vehículo', 'Proyecto', 'Conductor', 'Salida', 'Km Salida', 'Regreso', 'Km Regreso', 'Distancia (Km)'];
        return $this->generarArchivo('Bitacora_Viajes', $data, $headings, $formato);
    }

    private function generarArchivo($nombre, $data, $headings, $formato)
    {
        $filename = "Export_{$nombre}_" . Carbon::now()->format('Ymd_His');
        $exportData = collect($data)
            ->map(fn ($row) => array_values((array) $row))
            ->values()
            ->all();

        if ($formato === 'excel') {
            return Excel::download(new GenericExport($exportData, $headings), $filename . '.xlsx');
        }

        if ($formato === 'pdf') {
            $pdf = Pdf::loadView('exports.generic', [
                'headings' => $headings,
                'data' => $exportData,
                'title' => str_replace('_', ' ', $nombre)
            ])->setPaper('a4', 'landscape');
            return $pdf->download($filename . '.pdf');
        }

        abort(404, 'Formato no soportado');
    }
}
