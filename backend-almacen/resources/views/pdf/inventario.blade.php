<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Reporte de Inventario</title>
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
        thead {
            display: table-header-group;
        }
        tr {
            page-break-inside: avoid;
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
    <h1>Reporte de Inventario (Almacén)</h1>
    <div class="meta">
        Generado el {{ $fecha }} por {{ $generado_por }}
    </div>

    <table>
        <thead>
            <tr>
                <th>Artículo</th>
                <th>Modelo</th>
                <th>Subcategoría</th>
                <th>Stock</th>
                <th>Mínimo</th>
                <th>Ubicación</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($inventario as $row)
                <tr>
                    <td>{{ $row->nombre }}</td>
                    <td class="muted">{{ $row->modelo ?: '-' }}</td>
                    <td>{{ $row->subcategoria ?: '-' }}</td>
                    <td>{{ $row->cantidad }}</td>
                    <td>{{ $row->stock_minimo }}</td>
                    <td>{{ $row->ubicacion ?: '-' }}</td>
                </tr>
            @empty
                <tr><td colspan="6" class="muted">Sin registros en inventario</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
