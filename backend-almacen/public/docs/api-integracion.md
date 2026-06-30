# API de Integración Externa - SmartLynk

SmartLynk proporciona una API RESTful para permitir a otros sistemas (ERPs, e-commerce, herramientas de BI) conectarse y consultar la información en tiempo real.

## Autenticación
Todas las peticiones deben incluir un Bearer Token válido en el encabezado `Authorization`.
Los tokens se pueden generar en la sección de Administración -> Usuarios de la plataforma.

```http
Authorization: Bearer {TU_TOKEN}
Accept: application/json
```

## Endpoints Disponibles

### 1. Consultar Inventario Completo
Retorna todos los artículos, consumibles y series disponibles en el almacén.
**Endpoint:** `GET /api/almacen/articulos`

#### Respuesta (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Laptop Dell Latitude 5420",
      "categoria_nombre": "Equipos de Cómputo",
      "cantidad": 15,
      "stock_minimo": 5,
      "ubicacion": "ALMACEN_PRINCIPAL"
    }
  ]
}
```

### 2. Consultar Historial de Movimientos
Consulta entradas, salidas, préstamos y devoluciones recientes.
**Endpoint:** `GET /api/almacen/movimientos`

#### Parámetros Opcionales
- `fecha_inicio`: YYYY-MM-DD
- `fecha_fin`: YYYY-MM-DD
- `tipo`: entrada, salida, prestamo, devolucion, ajuste

#### Respuesta (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": 45,
      "tipo": "salida",
      "fecha_hora": "2026-10-15 14:30:00",
      "usuario": "Juan Pérez",
      "notas": "Salida de material para proyecto X"
    }
  ]
}
```

### 3. Consultar Flotilla Activa
Retorna los vehículos activos y su estado actual.
**Endpoint:** `GET /api/flotilla/vehiculos/activos`

#### Respuesta (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "placa": "XYZ-9876",
      "nombre": "Nissan NP300 (Reparto)",
      "estado": "DISPONIBLE",
      "kilometraje_actual": 45000
    }
  ]
}
```

## Límites de Peticiones (Rate Limiting)
- La API permite hasta **60 peticiones por minuto** por dirección IP.
- Si se excede el límite, la API responderá con un código `429 Too Many Requests`.

## Códigos de Respuesta Comunes
- `200 OK`: Petición exitosa.
- `401 Unauthorized`: Token faltante o inválido.
- `404 Not Found`: Recurso no encontrado.
- `422 Unprocessable Entity`: Error de validación en los parámetros enviados.
- `429 Too Many Requests`: Límite de peticiones excedido.
