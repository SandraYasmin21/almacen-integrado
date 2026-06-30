<?php

namespace App\Http\Controllers;

use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use App\Models\ConfiguracionSistema;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DocumentoOperacionController extends Controller
{
    public function generarPdf(Request $request, string $tipo)
    {
        abort_unless(in_array($tipo, ['asignacion-equipo', 'hoja-entrega', 'prestamo-externo'], true), 404);

        $validated = $request->validate([
            'fecha' => 'nullable|date',
            'recibe' => 'nullable|string|max:180',
            'entrega' => 'nullable|string|max:180',
            'cargo_entrega' => 'nullable|string|max:180',
            'destinatario' => 'nullable|string|max:180',
            'motivo' => 'nullable|string|max:240',
            'items' => 'required|array|min:1|max:30',
            'items.*.cantidad' => 'nullable|string|max:50',
            'items.*.equipo' => 'required|string|max:180',
            'items.*.modelo' => 'nullable|string|max:120',
            'items.*.serie' => 'nullable|string|max:160',
            'items.*.unidad' => 'nullable|string|max:50',
        ]);

        $fecha = !empty($validated['fecha'])
            ? Carbon::parse($validated['fecha'])
            : now();

        $documento = $this->documentoConfig($tipo);
        $firmaEntregaNombre = ConfiguracionSistema::value('pdf.firma_entrega_nombre', 'Ing. Dacia Edith Quintanilla Zuniga');
        $firmaEntregaCargo = ConfiguracionSistema::value('pdf.firma_entrega_cargo', 'Encargada de Almacen');

        $data = [
            'tipo' => $tipo,
            'documento' => $documento,
            'fechaTexto' => $this->fechaTexto($fecha),
            'recibe' => $validated['recibe'] ?? 'Nombre y firma',
            'entrega' => $validated['entrega'] ?? $firmaEntregaNombre,
            'cargoEntrega' => $validated['cargo_entrega'] ?? $firmaEntregaCargo,
            'destinatario' => $validated['destinatario'] ?? ($validated['recibe'] ?? 'Nombre de quien recibe'),
            'motivo' => $validated['motivo'] ?? null,
            'items' => collect($validated['items'])->map(function ($item, $index) use ($tipo) {
                return [
                    'partida' => $index + 1,
                    'cantidad' => $item['cantidad'] ?? ($tipo === 'prestamo-externo' ? '1' : '1 pieza'),
                    'equipo' => $item['equipo'],
                    'modelo' => $item['modelo'] ?? 'N/A',
                    'serie' => $item['serie'] ?? 'N/A',
                    'unidad' => $item['unidad'] ?? 'PZA',
                ];
            })->values(),
        ];

        $pdf = Pdf::loadView('pdf.documento-operacion', $data)->setPaper('letter', 'portrait');
        $filename = Str::slug($documento['filename'] . '-' . $fecha->format('Ymd')) . '.pdf';

        return $pdf->download($filename);
    }

    private function documentoConfig(string $tipo): array
    {
        return match ($tipo) {
            'asignacion-equipo' => [
                'titulo' => 'ASIGNACION DE EQUIPO',
                'intro' => 'Se hace la entrega del siguiente equipo en condicion de ASIGNACION.',
                'filename' => 'asignacion-equipo',
                'columns' => ['CANTIDAD', 'EQUIPO', 'MODELO', 'No. DE SERIE'],
            ],
            'prestamo-externo' => [
                'titulo' => 'SE ENTREGA',
                'intro' => null,
                'filename' => 'prestamo-equipo-externo',
                'columns' => ['N. de partida', 'Articulo/Equipo', 'Modelo', 'Numero de serie', 'Cantidad', 'Unidad'],
            ],
            default => [
                'titulo' => 'ENTREGA DE EQUIPO, BAJO RESGUARDO TEMPORAL DE:',
                'intro' => null,
                'filename' => 'hoja-entrega',
                'columns' => ['Cantidad', 'Equipo', 'Modelo', 'Numero de serie'],
            ],
        };
    }

    private function fechaTexto(Carbon $fecha): string
    {
        $meses = [
            1 => 'enero', 2 => 'febrero', 3 => 'marzo', 4 => 'abril',
            5 => 'mayo', 6 => 'junio', 7 => 'julio', 8 => 'agosto',
            9 => 'septiembre', 10 => 'octubre', 11 => 'noviembre', 12 => 'diciembre',
        ];

        return 'Cd Victoria Tamaulipas, a ' . $fecha->format('d') . ' de ' . $meses[(int) $fecha->format('n')] . ' del ' . $fecha->format('Y') . '.';
    }
}
