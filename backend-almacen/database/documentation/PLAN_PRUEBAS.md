# Plan De Pruebas Funcionales

## Seguridad
- Login con usuario activo.
- Rechazo de usuario inactivo.
- Acceso denegado a rutas fuera del rol.
- Acciones bloqueadas por Policy aunque se manipule el frontend.

## Inventario
- Alta individual de articulo.
- Alta masiva Excel/CSV con rollback atomico.
- Duplicados ignorados y reportados.
- Baja logica conserva historial.
- Transferencia cambia `ubicacion_id`.
- Salida de material no permite stock negativo.

## Proyectos
- Crear proyecto con cliente, responsable y estatus.
- Asociar recurso a proyecto.
- Retirar recurso del proyecto.
- Reporte por proyecto refleja el cambio.

## Vehiculos
- Alta de vehiculo con codigo, placas, NIV, estatus y kilometraje.
- Registro de mantenimiento guarda usuario capturista.
- Lectura de kilometraje actualiza `vehiculos_flotilla.kilometraje_actual`.
- Gasto extra suma al reporte financiero.

## Reportes
- Activos registrados.
- Activos por estado.
- Activos por ubicacion.
- Activos por responsable.
- Activos por proyecto.
- Materiales/consumibles.
- Vehiculos.
- Movimientos por fecha y tipo.

## Backup
- Generar backup local.
- Descargar backup.
- Subir backup a disco externo configurado.
