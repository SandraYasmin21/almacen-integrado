<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Reporte de Dashboard</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #0f172a; font-size: 11px; }
        h1 { margin: 0 0 4px; font-size: 20px; }
        h2 { font-size: 14px; margin-top: 20px; margin-bottom: 10px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        .meta { margin-bottom: 18px; color: #64748b; }
        .grid-cards { width: 100%; margin-bottom: 20px; }
        .grid-cards td { border: 1px solid #e2e8f0; padding: 10px; width: 25%; vertical-align: top; background: #f8fafc; }
        .card-title { font-size: 10px; color: #64748b; text-transform: uppercase; margin-bottom: 5px; font-weight: bold; }
        .card-value { font-size: 24px; font-weight: bold; color: #0f172a; }
        table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        table.data-table th { background: #f8fafc; color: #475569; font-size: 10px; text-align: left; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding: 8px; }
        table.data-table td { border-bottom: 1px solid #e2e8f0; padding: 8px; }
        .muted { color: #64748b; }
        .text-right { text-align: right; }
    </style>
</head>
<body>
    <h1>Reporte General (Dashboard)</h1>
    <div class="meta">
        Generado el {{ $fecha }} por {{ $generado_por }}
    </div>

    <table class="grid-cards">
        <tr>
            <td>
                <div class="card-title">Artículos en Inventario</div>
                <div class="card-value">{{ $data['total_activos'] }}</div>
            </td>
            <td>
                <div class="card-title">Por Reponer</div>
                <div class="card-value">{{ $data['por_reponer'] }}</div>
            </td>
            <td>
                <div class="card-title">Préstamos Vencidos</div>
                <div class="card-value">{{ $data['prestamos_vencidos'] }}</div>
            </td>
            <td>
                <div class="card-title">Vehículos en Ruta</div>
                <div class="card-value">{{ $data['vehiculos_ruta'] }} / {{ $data['vehiculos_total'] }}</div>
            </td>
        </tr>
    </table>

    <h2>Semáforo de Inventario (Bajo Stock)</h2>
    <table class="data-table">
        <thead>
            <tr>
                <th>Artículo</th>
                <th>Ubicación</th>
                <th class="text-right">Stock Actual</th>
                <th class="text-right">Mínimo</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($data['semaforo'] as $item)
                <tr>
                    <td>{{ $item['nombre'] }}</td>
                    <td>{{ $item['ubicacion'] ?: '-' }}</td>
                    <td class="text-right"><strong>{{ $item['stock_actual'] }}</strong></td>
                    <td class="text-right muted">{{ $item['stock_minimo'] }}</td>
                </tr>
            @empty
                <tr><td colspan="4" class="muted">No hay artículos con stock crítico</td></tr>
            @endforelse
        </tbody>
    </table>

    <h2>Top Artículos (Mayor Rotación)</h2>
    <table class="data-table">
        <thead>
            <tr>
                <th>Artículo</th>
                <th class="text-right">Salidas (últimos 30 días)</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($data['top_articulos'] as $item)
                <tr>
                    <td>{{ $item['nombre'] }}</td>
                    <td class="text-right"><strong>{{ $item['salidas'] }}</strong></td>
                </tr>
            @empty
                <tr><td colspan="2" class="muted">Sin movimientos recientes</td></tr>
            @endforelse
        </tbody>
    </table>

    <h2>Movimientos Recientes</h2>
    <table class="data-table">
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Artículo</th>
                <th>Cantidad</th>
                <th>Usuario</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($data['movimientos_recientes'] as $mov)
                <tr>
                    <td>{{ $mov['fecha_hora'] }}</td>
                    <td><strong>{{ strtoupper($mov['tipo']) }}</strong></td>
                    <td>{{ $mov['articulo'] }}</td>
                    <td>{{ $mov['cantidad'] }}</td>
                    <td>{{ $mov['usuario'] }}</td>
                </tr>
            @empty
                <tr><td colspan="5" class="muted">Sin movimientos</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
