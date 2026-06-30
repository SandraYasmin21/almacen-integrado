# Diagrama Entidad-Relacion Base

```mermaid
erDiagram
    usuarios_sistema ||--o{ movimiento_inventario : registra
    usuarios_sistema ||--o{ registros_vehiculares : captura
    usuarios_sistema ||--o{ auditoria_sistema : audita

    categorias ||--o{ subcategorias : contiene
    subcategorias ||--o{ catalogo_articulos : clasifica
    catalogo_articulos ||--o{ stock_general : acumula
    catalogo_articulos ||--o{ inventario_series : serializa
    ubicaciones ||--o{ stock_general : ubica
    ubicaciones ||--o{ inventario_series : ubica

    empleados ||--o{ asignaciones_activos : responsable
    inventario_series ||--o{ asignaciones_activos : asigna

    movimiento_inventario ||--o{ detalle_movimiento : detalla
    catalogo_articulos ||--o{ detalle_movimiento : mueve
    inventario_series ||--o{ detalle_movimiento : mueve

    proyectos_presupuestos ||--o{ proyecto_recursos : contiene
    catalogo_articulos ||--o{ proyecto_recursos : recurso
    inventario_series ||--o{ proyecto_recursos : recurso
    vehiculos_flotilla ||--o{ proyecto_recursos : recurso

    vehiculos_flotilla ||--o{ registros_vehiculares : historial
    vehiculos_flotilla ||--o{ gastos_extra_vehiculos : gastos
    vehiculos_flotilla ||--o{ bitacora_vehiculos : viajes

    catalogos_configurables ||--o{ catalogos_configurables : agrupa_por_tipo
```

## Notas
- `movimiento_inventario.folio` es el identificador formal visible del movimiento.
- `inventario_series.ubicacion_id` y `stock_general.ubicacion_id` son la ubicacion fisica formal.
- `catalogos_configurables` concentra estados, estatus, tipos de movimiento, marcas y tipos de activo.
- `auditoria_sistema` conserva cambios, soft deletes, restores y eventos operativos.
