<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>{{ $title ?? 'Reporte' }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #0f172a; font-size: 9px; }
        h1 { margin: 0 0 4px; font-size: 18px; }
        .meta { margin-bottom: 16px; color: #64748b; }
        table { width: 100%; border-collapse: collapse; }
        thead { display: table-header-group; }
        tr { page-break-inside: avoid; }
        th { background: #e2e8f0; color: #334155; text-align: left; }
        th, td { border: 1px solid #cbd5e1; padding: 5px; vertical-align: top; }
        tbody tr:nth-child(even) { background: #f8fafc; }
        .empty { padding: 18px; text-align: center; color: #64748b; }
    </style>
</head>
<body>
    <h1>{{ $title ?? 'Reporte' }}</h1>
    <div class="meta">Generado: {{ $date ?? now()->format('d/m/Y H:i') }}</div>
    <table>
        <thead>
            <tr>
                @foreach (($headings ?? []) as $heading)
                    <th>{{ str_replace('_', ' ', $heading) }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse (($data ?? []) as $row)
                <tr>
                    @foreach ((array) $row as $value)
                        <td>{{ is_scalar($value) || $value === null ? ($value ?? '-') : json_encode($value, JSON_UNESCAPED_UNICODE) }}</td>
                    @endforeach
                </tr>
            @empty
                <tr><td class="empty" colspan="{{ max(count($headings ?? []), 1) }}">Sin registros para mostrar</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
