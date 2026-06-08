<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework.

In addition, [Laracasts](https://laracasts.com) contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

You can also watch bite-sized lessons with real-world projects on [Laravel Learn](https://laravel.com/learn), where you will be guided through building a Laravel application from scratch while learning PHP fundamentals.

## Agentic Development

Laravel's predictable structure and conventions make it ideal for AI coding agents like Claude Code, Cursor, and GitHub Copilot. Install [Laravel Boost](https://laravel.com/docs/ai) to supercharge your AI workflow:

```bash
composer require laravel/boost --dev

php artisan boost:install
```

Boost provides your agent 15+ tools and skills that help agents build Laravel applications while following best practices.

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).

---

## 🚗 Módulo: Controlador de Flotilla Vehicular (SmartLynk)

Este módulo gestiona el ciclo de vida completo de la flotilla vehicular de la empresa.

### Requisitos previos

- PHP 8.3+
- PostgreSQL corriendo y accesible
- Composer instalado
- El archivo `.env` configurado con los datos de conexión a la BD

---

### 1. Instalación de dependencias

```bash
composer install
```

---

### 2. Configurar variables de entorno

Copia el archivo de ejemplo y edítalo con tus datos reales:

```bash
copy .env.example .env
```

Variables clave para el módulo de flotilla en `.env`:

```env
# Base de datos PostgreSQL
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=almacen_sistema
DB_USERNAME=postgres
DB_PASSWORD=tu_password

# CORS: orígenes que pueden consumir la API (separar con coma si son varios)
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Rate Limiting: máximo de peticiones por minuto por IP en rutas de flotilla
FLOTILLA_RATE_LIMIT=60
```

---

### 3. Generar clave de la aplicación (solo primera vez)

```bash
php artisan key:generate
```

---

### 4. Ejecutar las migraciones de la flotilla

> ⚠️ Esto creará las 4 tablas en PostgreSQL. Asegúrate de que la BD exista y esté accesible.

```bash
php artisan migrate
```

Tablas que se crearán:
- `vehiculos_flotilla` — Catálogo principal de vehículos
- `registros_vehiculares` — Mantenimientos (preventivo, correctivo, lectura)
- `gastos_extra_vehiculos` — Gastos adicionales por vehículo
- `bitacora_vehiculos` — Bitácora de operación diaria (viajes)

---

### 5. Limpiar y optimizar la caché de configuración

```bash
php artisan config:clear
php artisan cache:clear
```

---

### 6. Iniciar el servidor de desarrollo

```bash
composer run dev
```

O bien solo el servidor PHP:

```bash
php artisan serve
```

El API estará disponible en: `http://localhost:8000/api`

---

### 📋 Endpoints del Módulo de Flotilla

Todos los endpoints tienen prefijo `/api/flotilla/` y están sujetos a rate limiting (60 req/min por IP por defecto).

#### Catálogo de Vehículos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/flotilla/vehiculos` | Listar todos los vehículos |
| `GET` | `/api/flotilla/vehiculos/activos` | Solo vehículos activos (para dropdowns) |
| `POST` | `/api/flotilla/vehiculos` | Registrar nuevo vehículo |
| `GET` | `/api/flotilla/vehiculos/{id}` | Ver detalle de un vehículo |
| `PUT` | `/api/flotilla/vehiculos/{id}` | Actualizar vehículo |
| `DELETE` | `/api/flotilla/vehiculos/{id}` | Dar de baja un vehículo (no se elimina) |

#### Registro Vehicular (Mantenimientos)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/flotilla/registros` | Listar registros (filtros: `vehiculo_id`, `tipo`) |
| `POST` | `/api/flotilla/registros` | Crear registro de mantenimiento |
| `GET` | `/api/flotilla/registros/{id}` | Ver detalle |
| `PUT` | `/api/flotilla/registros/{id}` | Actualizar |
| `DELETE` | `/api/flotilla/registros/{id}` | Eliminar |

#### Gastos Extra
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/flotilla/gastos-extra` | Listar gastos (filtro: `vehiculo_id`) |
| `POST` | `/api/flotilla/gastos-extra` | Registrar gasto extra |
| `GET` | `/api/flotilla/gastos-extra/{id}` | Ver detalle |
| `PUT` | `/api/flotilla/gastos-extra/{id}` | Actualizar |
| `DELETE` | `/api/flotilla/gastos-extra/{id}` | Eliminar |

#### Bitácora de Viajes
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/flotilla/bitacora-viajes` | Listar viajes (filtros: `vehiculo_id`, `empleado_id`) |
| `POST` | `/api/flotilla/bitacora-viajes` | Registrar salida de vehículo |
| `GET` | `/api/flotilla/bitacora-viajes/{id}` | Ver detalle de un viaje |
| `PUT` | `/api/flotilla/bitacora-viajes/{id}` | Registrar regreso (km_final, observaciones) |
| `GET` | `/api/flotilla/bitacora-viajes/km-sugerido/{vehiculo_id}` | Obtener km inicial sugerido |

#### Dashboard y Reportes
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/flotilla/dashboard` | Estadísticas (filtros: `anio`, `mes`, `dia`) |
| `GET` | `/api/flotilla/kilometraje` | Tabla de kilometraje y alertas de mantenimiento |

---

### 🔐 Seguridad implementada

| Medida | Detalle |
|--------|---------|
| **CORS** | Orígenes configurados en `CORS_ALLOWED_ORIGINS` del `.env` |
| **Rate Limiting** | `FLOTILLA_RATE_LIMIT` req/min por IP (default: 60) |
| **Sanitización** | `strip_tags()` + `trim()` en todos los campos de texto libre |
| **Validación** | Laravel Validator con reglas estrictas en todos los endpoints |
| **Credenciales** | Sin hardcoding — todo desde variables de entorno |
| **Soft Delete** | Vehículos nunca se eliminan, se marcan como INACTIVO |
