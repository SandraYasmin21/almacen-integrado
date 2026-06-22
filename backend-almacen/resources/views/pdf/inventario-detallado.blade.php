<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Inventario Detallado</title>
    <style>
        body { font-family: sans-serif; font-size: 10px; color: #333; }
        h2 { text-align: center; color: #1e293b; margin-bottom: 5px; }
        p.date { text-align: center; color: #64748b; margin-top: 0; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; }
        th { background-color: #f8fafc; color: #475569; text-transform: uppercase; font-size: 9px; }
        tr:nth-child(even) { background-color: #f1f5f9; }
    </style>
</head>
<body>
    <h2>Reporte de Inventario Detallado</h2>
    <p class="date">Generado el: {{ $fecha }}</p>

    <table>
        <thead>
            <tr>
                @foreach($headings as $head)
                    <th>{{ $head }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach($rows as $row)
                <tr>
                    @foreach($row as $cell)
                        <td>{{ $cell }}</td>
                    @endforeach
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>