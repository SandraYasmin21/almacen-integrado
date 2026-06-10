<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Órdenes de Compra</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            color: #0f172a;
            font-size: 11px;
        }
        h1 { margin: 0 0 4px; font-size: 20px; }
        .meta { margin-bottom: 18px; color: #64748b; }
        table { width: 100%; border-collapse: collapse; }
        thead { display: table-header-group; }
        tr { page-break-inside: avoid; }
        th {
            background: #f8fafc;
            color: #475569;
            font-size: 10px;
            text-align: left;
            text-transform: uppercase;
        }
        th, td { border-bottom: 1px solid #e2e8f0; padding: 8px; }
        .muted { color: #64748b; }
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 9999px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge-borrador   { background: #f1f5f9; color: #64748b; }
        .badge-enviada    { background: #dbeafe; color: #1d4ed8; }
        .badge-parcial    { background: #fef3c7; color: #b45309; }
        .badge-completada { background: #d1fae5; color: #065f46; }
    </style>
</head>
<body>
    <h1>Órdenes de Compra</h1>
    <div class="meta">
        Generado el {{ now()->format('d/m/Y H:i') }} — Sistema SmartLynk
    </div>

    <table>
        <thead>
            <tr>
                <th>Folio</th>
                <th>Proveedor</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Fecha Esperada</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($ordenes as $oc)
                @php
                    $badgeClass = match($oc->estado) {
                        'enviada'              => 'badge-enviada',
                        'recibida_parcialmente'=> 'badge-parcial',
                        'completada'           => 'badge-completada',
                        default                => 'badge-borrador',
                    };
                    $estadoLabel = match($oc->estado) {
                        'borrador'             => 'Borrador',
                        'enviada'              => 'Enviada',
                        'recibida_parcialmente'=> 'Rec. Parcial',
                        'completada'           => 'Completada',
                        default                => ucfirst($oc->estado),
                    };
                @endphp
                <tr>
                    <td><strong>{{ $oc->folio }}</strong></td>
                    <td>{{ $oc->proveedor ?? '—' }}</td>
                    <td><span class="badge {{ $badgeClass }}">{{ $estadoLabel }}</span></td>
                    <td>{{ \Carbon\Carbon::parse($oc->created_at)->format('d/m/Y') }}</td>
                    <td class="muted">{{ $oc->fecha_esperada ? \Carbon\Carbon::parse($oc->fecha_esperada)->format('d/m/Y') : '—' }}</td>
                </tr>
            @empty
                <tr><td colspan="5" class="muted">Sin órdenes de compra registradas</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
