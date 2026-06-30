# Manual Tecnico

## Backend
- Framework: Laravel.
- Autenticacion: Sanctum.
- Base de datos principal: PostgreSQL.
- Migraciones: `backend-almacen/database/migrations`.
- Seeders: `backend-almacen/database/seeders`.

## Migraciones Clave
- `2026_06_29_000001_harden_inventory_imports_movements_and_locations.php`
- `2026_06_29_000002_complete_governance_catalogs_audit_backup.php`
- `2026_06_29_000003_complete_essential_requirements_schema.php`

## Comandos
- `php artisan migrate`
- `php artisan db:seed --class=CatalogosConfigurablesSeeder`
- `php artisan db:backup`
- `php artisan inventario:verificar-consistencia`

## Seguridad
- Middleware: `check.role`.
- Policies: articulos, series, movimientos, vehiculos, usuarios, proyectos, reportes y catalogos configurables.
- Auditoria: observers registrados en `AppServiceProvider`.

## Respaldos
- Comando: `php artisan db:backup`.
- Ruta API: `POST /api/admin/backups`.
- Requiere `pg_dump` disponible o `PG_DUMP_PATH` configurado.

## Frontend
- Framework: React + Vite.
- Rutas principales en `frontend-smartlynk/src/main.jsx`.
- Menu principal en `frontend-smartlynk/src/components/Layout.jsx`.
