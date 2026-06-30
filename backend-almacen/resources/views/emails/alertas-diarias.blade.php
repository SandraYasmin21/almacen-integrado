<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SmartLynk - Alertas Diarias</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .header { background-color: #1e293b; color: #ffffff; padding: 24px; text-align: center; }
        .content { padding: 32px; }
        h1 { margin: 0; font-size: 24px; font-weight: 700; }
        h2 { color: #0f172a; font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 24px; }
        ul { list-style-type: none; padding: 0; margin: 0; }
        li { padding: 12px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; }
        li:last-child { border-bottom: none; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 9999px; font-size: 12px; font-weight: 700; }
        .badge-danger { background-color: #fee2e2; color: #b91c1c; }
        .badge-warning { background-color: #fef3c7; color: #b45309; }
        .footer { background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Resumen de Alertas SmartLynk</h1>
            <p style="margin: 8px 0 0; color: #94a3b8;">{{ $data['fecha'] }}</p>
        </div>
        
        <div class="content">
            <p>Hola Administrador,</p>
            <p>Este es el resumen automatizado de las alertas críticas que requieren atención en el sistema.</p>

            @if(count($data['stockCritico']) > 0)
                <h2>🔴 Stock Crítico de Consumibles</h2>
                <ul>
                    @foreach($data['stockCritico'] as $item)
                        <li>
                            <span>{{ $item->nombre }}</span>
                            <span class="badge badge-danger">Stock: {{ $item->cantidad_actual }} / Min: {{ $item->stock_minimo }}</span>
                        </li>
                    @endforeach
                </ul>
            @endif

            @if(count($data['prestamosVencidos']) > 0)
                <h2>⚠️ Préstamos Prolongados (>30 días)</h2>
                <ul>
                    @foreach($data['prestamosVencidos'] as $prestamo)
                        <li>
                            <span>
                                <strong>{{ $prestamo->empleado }}</strong><br>
                                <span style="font-size: 13px; color: #64748b;">{{ $prestamo->articulo }} ({{ $prestamo->numero_serie_fabricante }})</span>
                            </span>
                            <span class="badge badge-warning" style="align-self: center;">
                                Desde: {{ \Carbon\Carbon::parse($prestamo->fecha_entrega)->format('d/m/Y') }}
                            </span>
                        </li>
                    @endforeach
                </ul>
            @endif

            @if(count($data['vehiculosPoliza']) > 0)
                <h2>🚗 Pólizas de Vehículos por Vencer</h2>
                <ul>
                    @foreach($data['vehiculosPoliza'] as $vehiculo)
                        <li>
                            <span>{{ $vehiculo->nombre }} ({{ $vehiculo->placa }})</span>
                            <span class="badge badge-warning">
                                Vence: {{ \Carbon\Carbon::parse($vehiculo->fecha_vencimiento_poliza)->format('d/m/Y') }}
                            </span>
                        </li>
                    @endforeach
                </ul>
            @endif

            <p style="margin-top: 32px; font-size: 14px; text-align: center;">
                Por favor, ingresa a <a href="{{ env('APP_URL') }}" style="color: #3b82f6; text-decoration: none;">SmartLynk</a> para más detalles.
            </p>
        </div>

        <div class="footer">
            Este es un correo generado automáticamente. Por favor no respondas a este mensaje.
        </div>
    </div>
</body>
</html>
