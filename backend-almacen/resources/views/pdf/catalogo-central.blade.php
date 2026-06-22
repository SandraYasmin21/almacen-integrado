<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Catálogo Central</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            color: #0f172a;
            font-size: 11px;
        }
        h1 {
            margin: 0 0 4px;
            font-size: 20px;
        }
        .meta {
            margin-bottom: 18px;
            color: #64748b;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th {
            background: #f8fafc;
            color: #475569;
            font-size: 10px;
            text-align: left;
            text-transform: uppercase;
        }
        th,
        td {
            border-bottom: 1px solid #e2e8f0;
            padding: 8px;
        }
        .muted {
            color: #64748b;
        }
    </style>
</head>
<body>
    <h1>Catálogo Central</h1>
    <div class="meta">
        {{ $tipo === 'vehiculos' ? 'Vehículos' : 'Artículos y herramientas' }} · Generado {{ $fecha }}
    </div>

    @if ($tipo === 'vehiculos')
        <table>
            <thead>
                <tr>
                    <th>Vehículo</th>
                    <th>Modelo</th>
                    <th>Placas</th>
                    <th>NIV</th>
                    <th>Tipo</th>
                    <th>GPS</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($rows as $row)
                    <tr>
                        <td>{{ $row->nombre }}</td>
                        <td>{{ $row->modelo }}</td>
                        <td>{{ $row->placas }}</td>
                        <td class="muted">{{ $row->numero_serie ?: '-' }}</td>
                        <td>{{ $row->tipo_vehiculo }}</td>
                        <td>{{ $row->estado_gps ?: '-' }}</td>
                        <td>{{ $row->estado }}</td>
                    </tr>
                @empty
                    <tr><td colspan="7" class="muted">Sin registros</td></tr>
                @endforelse
            </tbody>
        </table>
    @else
        <table>
            <thead>
                <tr>
                    <th>Artículo</th>
                    <th>Marca</th>
                    <th>Modelo</th>
                    <th>Categoría</th>
                    <th>Subcategoría</th>
                    <th>Unidad</th>
                    <th>Stock ideal</th>
                    <th>Stock actual</th>
                    <th>Tipo</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($rows as $row)
                    <tr>
                        <td>{{ $row->nombre }}</td>
                        <td>{{ $row->marca ?? 'N/A' }}</td> 
                        <td>{{ $row->modelo ?? 'N/A' }}</td>
                        <td>{{ $row->categoria ?: '-' }}</td>
                        <td>{{ $row->subcategoria ?: '-' }}</td>
                        <td>{{ $row->unidad_medida }}</td>
                        <td>{{ $row->stock_minimo }}</td>
                        <td>{{ $row->stock_actual }}</td>
                        <td>{{ ucfirst($row->tipo_articulo) }}</td>
                    </tr>
                @empty
                    <tr><td colspan="8" class="muted">Sin registros</td></tr>
                @endforelse
            </tbody>
        </table>
    @endif
</body>
</html>
