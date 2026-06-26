<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>{{ $documento['titulo'] }}</title>
    <style>
        @page { margin: 52px 58px; }
        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            color: #111827;
            font-size: 12px;
            line-height: 1.45;
        }
        .date {
            text-align: right;
            margin-bottom: 54px;
        }
        .title {
            text-align: center;
            font-size: 18px;
            font-weight: 700;
            letter-spacing: .04em;
            margin: 0 0 26px;
        }
        .recipient {
            text-align: center;
            font-size: 16px;
            font-weight: 700;
            margin: -12px 0 28px;
            text-transform: uppercase;
        }
        .intro {
            margin: 0 0 24px;
            font-size: 13px;
        }
        .meta-table,
        .items {
            width: 100%;
            border-collapse: collapse;
        }
        .meta-table {
            margin-bottom: 18px;
        }
        .meta-table td {
            border: 1px solid #111827;
            padding: 8px 10px;
            font-size: 12px;
        }
        .items {
            margin-top: 12px;
        }
        .items th,
        .items td {
            border: 1px solid #111827;
            padding: 8px 9px;
            vertical-align: middle;
        }
        .items th {
            text-align: center;
            font-weight: 700;
            background: #f3f4f6;
        }
        .items td {
            min-height: 24px;
        }
        .center { text-align: center; }
        .signatures {
            width: 100%;
            margin-top: 86px;
            border-collapse: collapse;
        }
        .signatures td {
            width: 50%;
            text-align: center;
            vertical-align: bottom;
            padding: 0 26px;
        }
        .line {
            border-top: 1px solid #111827;
            padding-top: 8px;
            min-height: 44px;
        }
        .role {
            font-size: 11px;
            margin-top: 2px;
        }
        .label {
            font-weight: 700;
            margin-bottom: 46px;
        }
    </style>
</head>
<body>
    <div class="date">{{ $fechaTexto }}</div>

    @if ($tipo === 'prestamo-externo')
        <table class="meta-table">
            <tr>
                <td><strong>A:</strong> {{ $destinatario }}</td>
                <td><strong>FECHA:</strong> {{ $fechaTexto }}</td>
            </tr>
        </table>
    @endif

    <h1 class="title">{{ $documento['titulo'] }}</h1>

    @if ($tipo === 'hoja-entrega')
        <div class="recipient">{{ $recibe }}</div>
    @endif

    @if (!empty($documento['intro']))
        <p class="intro">{{ $documento['intro'] }}</p>
    @endif

    @if (!empty($motivo))
        <p class="intro"><strong>Motivo:</strong> {{ $motivo }}</p>
    @endif

    <table class="items">
        <thead>
            <tr>
                @foreach ($documento['columns'] as $column)
                    <th>{{ $column }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach ($items as $item)
                <tr>
                    @if ($tipo === 'prestamo-externo')
                        <td class="center">{{ $item['partida'] }}</td>
                        <td>{{ $item['equipo'] }}</td>
                        <td class="center">{{ $item['modelo'] }}</td>
                        <td class="center">{{ $item['serie'] }}</td>
                        <td class="center">{{ $item['cantidad'] }}</td>
                        <td class="center">{{ $item['unidad'] }}</td>
                    @else
                        <td class="center">{{ $item['cantidad'] }}</td>
                        <td>{{ $item['equipo'] }}</td>
                        <td class="center">{{ $item['modelo'] }}</td>
                        <td class="center">{{ $item['serie'] }}</td>
                    @endif
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="signatures">
        <tr>
            @if ($tipo === 'prestamo-externo')
                <td>
                    <div class="label">RECIBE:</div>
                    <div class="line">{{ $recibe }}</div>
                    <div class="role">Nombre y firma</div>
                </td>
                <td>
                    <div class="label">ENTREGA:</div>
                    <div class="line">{{ $entrega }}</div>
                    <div class="role">{{ $cargoEntrega }}</div>
                </td>
            @else
                <td>
                    <div class="label">Entrega:</div>
                    <div class="line">{{ $entrega }}</div>
                    <div class="role">{{ $cargoEntrega }}</div>
                </td>
                <td>
                    <div class="label">Recibe:</div>
                    <div class="line">{{ $recibe }}</div>
                    <div class="role">Nombre y firma</div>
                </td>
            @endif
        </tr>
    </table>
</body>
</html>
