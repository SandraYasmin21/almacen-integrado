import { Fragment, useState } from 'react';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { ArrowLeftOnRectangleIcon, Bars3Icon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import {
  ArchiveBoxIcon,
  ShoppingCartIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  DocumentDuplicateIcon,
  TruckIcon,
  ListBulletIcon,
} from '@heroicons/react/24/solid';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import ApplicationLogo from './ApplicationLogo';
import NotificationPopover from './NotificationPopover';
import { apiFetch, clearSession, getStoredUser } from '@/lib/auth';

const navigation = [
  {
    name: 'Catálogo Central',
    icon: ListBulletIcon,
    path: '/catalogo',
    defaultPath: '/catalogo/articulos',
    section: 'ADMINISTRACIÓN',
    subItems: [
      { name: 'Artículos', path: '/catalogo/articulos' },
      { name: 'Vehículos', path: '/catalogo/vehiculos' },
      { name: 'Subcategorías', path: '/catalogo/subcategorias' },
      { name: 'Configurables', path: '/catalogo/configurables' },
    ],
  },
  {
    name: 'Administración de Activos',
    icon: ArchiveBoxIcon,
    path: '/activos',
    defaultPath: '/activos/recepcion',
    section: 'MÓDULOS',
    subItems: [
      { name: 'Recepción', path: '/activos/recepcion' },
      { name: 'Estado de stock', path: '/activos/inventario' },
      { name: 'Historial y ajustes', path: '/activos/movimientos' },
      { name: 'Ubicaciones', path: '/admin/ubicaciones' },
    ],
  },
  {
    name: 'Mostrador',
    icon: ShoppingCartIcon,
    path: '/mostrador',
    defaultPath: '/mostrador/terminal',
    section: 'MÓDULOS',
    subItems: [
      { name: 'Terminal de Escáner', path: '/mostrador/terminal' },
      { name: 'Historial de resguardos y préstamos', path: '/mostrador/resguardos' },
      { name: 'Devoluciones', path: '/mostrador/devoluciones' },
    ],
  },
  {
    name: 'Empleados',
    icon: UsersIcon,
    path: '/empleados',
    defaultPath: '/empleados/directorio',
    section: 'MÓDULOS',
    subItems: [
      { name: 'Directorio', path: '/empleados/directorio' },
      { name: 'Resguardos', path: '/empleados/resguardos' },
      { name: 'Préstamos pendientes', path: '/empleados/prestamos' },
      { name: 'Control de usuarios', path: '/admin/usuarios-sistema' },
    ],
  },
  {
    name: 'Operaciones externas',
    icon: TruckIcon,
    path: '/operaciones',
    defaultPath: '/operaciones/ventas-ocasionales',
    section: 'MÓDULOS',
    subItems: [
      { name: 'Ventas ocasionales', path: '/operaciones/ventas-ocasionales' },
      { name: 'Gestor documental', path: '/operaciones/gestor-documental' },
      { name: 'Hojas de entrega', path: '/operaciones/hojas-entrega' },
    ],
  },
  {
    name: 'Flotilla',
    icon: TruckIcon,
    path: '/flotilla',
    defaultPath: '/flotilla/dashboard',
    section: 'MÓDULOS',
    subItems: [
      { name: 'Dashboard flotilla', path: '/flotilla/dashboard' },
      { name: 'Catálogo de vehículos', path: '/flotilla/vehiculos' },
      { name: 'Registro de mantenimientos', path: '/flotilla/mantenimientos' },
      { name: 'Gastos extra', path: '/flotilla/gastos' },
      { name: 'Bitácora de viajes', path: '/flotilla/bitacora' },
      { name: 'Control de kilometraje', path: '/flotilla/kilometraje' },
    ],
  },
  {
    name: 'Proyectos',
    icon: WrenchScrewdriverIcon,
    path: '/proyectos',
    defaultPath: '/proyectos',
    section: 'MÓDULOS',
  },
  {
    name: 'Reportes',
    icon: DocumentDuplicateIcon,
    path: '/reportes',
    defaultPath: '/reportes/basicos',
    section: 'REPORTES',
    subItems: [
      { name: 'Reportes básicos', path: '/reportes/basicos' },
      { name: 'Reportes vehiculares', path: '/reportes/vehiculares' },
    ],
  },
];

const rolePermissions = {
  '/admin/usuarios-sistema': ['Admin'],
  '/admin/ubicaciones': ['Admin', 'Almacen'],
  '/proyectos': ['Admin', 'Almacen', 'Proyecto', 'Direccion'],
  '/reportes': ['Admin', 'Direccion'],
  '/operaciones': ['Admin', 'Almacen'],
  '/flotilla': ['Admin', 'Almacen', 'Direccion'],
  '/empleados': ['Admin', 'Almacen'],
  '/mostrador': ['Admin', 'Almacen'],
  '/catalogo': ['Admin', 'Almacen', 'Almacenista'],
  '/activos': ['Admin', 'Almacen', 'Almacenista', 'Proyecto', 'Direccion'],
};

const emptySearchFilters = {
  codigo: '',
  nombre: '',
  categoria_id: '',
  marca: '',
  modelo: '',
  serie: '',
  responsable_id: '',
  ubicacion_id: '',
  proyecto_id: '',
  estado: '',
};

const estadosActivo = ['DISPONIBLE', 'ASIGNADO', 'EN_REPARACION', 'BAJA', 'EXTRAVIADO'];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function normalizeRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchFilters, setSearchFilters] = useState(emptySearchFilters);
  const [searchResults, setSearchResults] = useState([]);
  const [searchMeta, setSearchMeta] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [catalogsLoaded, setCatalogsLoaded] = useState(false);
  const [catalogs, setCatalogs] = useState({ categorias: [], empleados: [], ubicaciones: [], proyectos: [] });

  const user = getStoredUser() || { nombre_usuario: 'Usuario', email: '', rol_acceso: 'Usuario' };
  const userRole = user.rol_acceso || user.rol || 'Usuario';
  const userName = user.nombre_usuario || user.email || 'Usuario';
  const userDisplayName = userRole === 'Admin' ? 'Administrador Principal' : userName;
  const userDisplayRole = userRole === 'Admin' ? 'Administrador' : userRole;

  const handleLogout = (event) => {
    event?.preventDefault();
    clearSession();
    window.dispatchEvent(new Event('authChange'));
    navigate('/login');
  };

  const hasAccess = (path) => {
    const match = Object.entries(rolePermissions).find(([key]) => path === key || path.startsWith(`${key}/`));
    if (!match) return true;
    return match[1].includes(userRole);
  };

  const loadSearchCatalogs = async () => {
    if (catalogsLoaded) return;
    try {
      const calls = await Promise.allSettled([
        apiFetch('/api/categorias'),
        apiFetch('/api/empleados'),
        apiFetch('/api/ubicaciones'),
        apiFetch('/api/proyectos'),
      ]);

      const read = async (index) => {
        const item = calls[index];
        if (item.status !== 'fulfilled' || !item.value.ok) return [];
        return normalizeRows(await item.value.json());
      };

      setCatalogs({
        categorias: await read(0),
        empleados: await read(1),
        ubicaciones: await read(2),
        proyectos: await read(3),
      });
      setCatalogsLoaded(true);
    } catch {
      setCatalogsLoaded(true);
    }
  };

  const runTopbarSearch = async (event) => {
    event?.preventDefault();
    const params = new URLSearchParams({ per_page: '8' });
    const query = globalSearch.trim();
    if (query) params.append('q', query);
    Object.entries(searchFilters).forEach(([key, value]) => {
      if (String(value || '').trim()) params.append(key, value);
    });

    if (!query && [...params.keys()].length === 1) {
      setSearchResults([]);
      setSearchMeta(null);
      setSearchOpen(false);
      return;
    }

    setSearchLoading(true);
    setSearchOpen(true);
    try {
      const response = await apiFetch(`/api/busqueda-avanzada?${params.toString()}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'No se pudo buscar.');
      setSearchResults(normalizeRows(payload));
      setSearchMeta(payload);
    } catch {
      setSearchResults([]);
      setSearchMeta(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const openFilters = async () => {
    setFiltersOpen((value) => !value);
    await loadSearchCatalogs();
    setSearchOpen(true);
  };

  const updateFilter = (key, value) => {
    setSearchFilters((current) => ({ ...current, [key]: value }));
  };

  const clearSearch = () => {
    setGlobalSearch('');
    setSearchFilters(emptySearchFilters);
    setSearchResults([]);
    setSearchMeta(null);
    setSearchOpen(false);
    setFiltersOpen(false);
  };

  const goToSearchResult = (row) => {
    const code = row.codigo_interno_generado || row.sku_maestro || '';
    setSearchOpen(false);
    navigate(`/activos/inventario?buscar=${encodeURIComponent(code || row.nombre || '')}`);
  };

  const renderNavItems = (items) => items.map((item) => {
    const isParentActive = location.pathname.startsWith(item.path);

    if (item.subItems) {
      const visibleSubItems = item.subItems.filter((subItem) => hasAccess(subItem.path));
      if (!visibleSubItems.length) return null;

      return (
        <Disclosure as="div" key={item.name} defaultOpen={isParentActive}>
          {({ open }) => (
            <>
              <Disclosure.Button
                className={classNames(
                  isParentActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  'group flex w-full items-center rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                )}
              >
                <item.icon
                  className={classNames(
                    isParentActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-500',
                    'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                  )}
                  aria-hidden="true"
                />
                <span className="flex-1 text-left">{item.name}</span>
                <svg className={classNames(open ? 'rotate-90 text-slate-500' : 'text-slate-400', 'ml-3 h-5 w-5 flex-shrink-0 transition-transform duration-200')} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </Disclosure.Button>
              <Disclosure.Panel className="mt-1 space-y-1 px-4 pb-2">
                {visibleSubItems.map((subItem) => (
                  <NavLink
                    key={subItem.name}
                    to={subItem.path}
                    className={({ isActive }) => classNames(
                      isActive ? 'bg-blue-50/70 text-blue-700 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                      'block rounded-lg py-2 pl-9 pr-3 text-sm transition-colors',
                    )}
                  >
                    {subItem.name}
                  </NavLink>
                ))}
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
      );
    }

    return hasAccess(item.path) && (
      <NavLink
        key={item.name}
        to={item.defaultPath || item.path}
        className={({ isActive }) => classNames(
          isActive || location.pathname.startsWith(item.path) ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
          'group flex items-center rounded-xl px-3 py-2 text-sm font-medium transition-colors',
        )}
      >
        <item.icon className={classNames(location.pathname.startsWith(item.path) ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-500', 'mr-3 h-5 w-5 flex-shrink-0 transition-colors')} aria-hidden="true" />
        {item.name}
      </NavLink>
    );
  });

  return (
    <div className="min-h-full">
      <div className="hidden border-r border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col pt-5">
          <div className="mb-8 flex flex-shrink-0 items-center px-6">
            <ApplicationLogo className="block h-10 w-auto fill-current text-blue-600" />
            <span className="ml-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-xl font-bold text-transparent">SmartLynk</span>
          </div>

          <nav className="flex-1 space-y-6 overflow-y-auto px-4 pb-4" aria-label="Sidebar">
            {['ADMINISTRACIÓN', 'MÓDULOS', 'REPORTES'].map((section) => (
              <div key={section}>
                <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{section}</h3>
                <div className="space-y-1">{renderNavItems(navigation.filter((item) => item.section === section))}</div>
              </div>
            ))}
          </nav>
        </div>

        <div className="flex-shrink-0 border-t border-slate-200 bg-slate-50/80 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-white text-sm font-bold text-red-600 shadow-sm transition hover:border-red-200 hover:bg-red-50"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="flex h-screen flex-1 flex-col overflow-hidden lg:pl-72">
        <div className="sticky top-0 z-20 flex h-20 flex-shrink-0 border-b border-slate-200 bg-white shadow-sm">
          <button type="button" className="border-r border-slate-200 px-4 text-slate-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden">
            <span className="sr-only">Abrir sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex flex-1 items-center justify-between gap-5 px-5">
            <div className="flex min-w-0 flex-1 items-center">
              <form onSubmit={runTopbarSearch} className="relative w-full max-w-4xl">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  value={globalSearch}
                  onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
                  onChange={(event) => setGlobalSearch(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-28 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  placeholder="Buscar por código, activo, serie, responsable, ubicación o proyecto..."
                />
                <button type="button" onClick={openFilters} className="absolute right-20 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-blue-700">
                  Filtros
                </button>
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700">
                  Buscar
                </button>

                {searchOpen && (
                  <div className="absolute left-0 top-[calc(100%+10px)] z-50 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                    {filtersOpen && (
                      <div className="border-b border-slate-100 bg-slate-50/80 p-4">
                        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
                          <SearchInput label="Código" value={searchFilters.codigo} onChange={(value) => updateFilter('codigo', value)} />
                          <SearchInput label="Nombre" value={searchFilters.nombre} onChange={(value) => updateFilter('nombre', value)} />
                          <SearchSelect label="Categoría" value={searchFilters.categoria_id} onChange={(value) => updateFilter('categoria_id', value)} options={catalogs.categorias.map((item) => ({ value: item.id, label: item.nombre }))} />
                          <SearchInput label="Marca" value={searchFilters.marca} onChange={(value) => updateFilter('marca', value)} />
                          <SearchInput label="Modelo" value={searchFilters.modelo} onChange={(value) => updateFilter('modelo', value)} />
                          <SearchInput label="Serie" value={searchFilters.serie} onChange={(value) => updateFilter('serie', value)} />
                          <SearchSelect label="Responsable" value={searchFilters.responsable_id} onChange={(value) => updateFilter('responsable_id', value)} options={catalogs.empleados.map((item) => ({ value: item.id, label: item.nombre_completo || item.nombre }))} />
                          <SearchSelect label="Ubicación" value={searchFilters.ubicacion_id} onChange={(value) => updateFilter('ubicacion_id', value)} options={catalogs.ubicaciones.map((item) => ({ value: item.id, label: item.nombre }))} />
                          <SearchSelect label="Proyecto" value={searchFilters.proyecto_id} onChange={(value) => updateFilter('proyecto_id', value)} options={catalogs.proyectos.map((item) => ({ value: item.id, label: item.nombre }))} />
                          <SearchSelect label="Estado" value={searchFilters.estado} onChange={(value) => updateFilter('estado', value)} options={estadosActivo.map((estado) => ({ value: estado, label: estado }))} />
                        </div>
                      </div>
                    )}

                    <div className="max-h-96 overflow-y-auto">
                      {searchLoading ? (
                        <div className="px-5 py-8 text-center text-sm font-semibold text-slate-400">Buscando...</div>
                      ) : searchResults.length === 0 ? (
                        <div className="px-5 py-8 text-center text-sm text-slate-400">Sin resultados. Escribe una búsqueda o ajusta filtros.</div>
                      ) : (
                        searchResults.map((row, index) => (
                          <button
                            key={`${row.articulo_id}-${row.serie_id || index}`}
                            type="button"
                            onClick={() => goToSearchResult(row)}
                            className="block w-full border-b border-slate-50 px-5 py-3 text-left hover:bg-blue-50/50"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-black text-slate-900">{row.nombre}</p>
                                <p className="mt-1 truncate text-xs text-slate-500">
                                  {row.codigo_interno_generado || row.sku_maestro || 'Sin código'} · {row.categoria || 'Sin categoría'} · {row.ubicacion || 'Sin ubicación'}
                                </p>
                              </div>
                              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">{row.estado || row.tipo_control || '-'}</span>
                            </div>
                            <p className="mt-1 truncate text-xs text-slate-400">
                              Marca: {row.marca || '-'} · Modelo: {row.modelo || '-'} · Serie: {row.numero_serie_fabricante || '-'} · Responsable: {row.responsable || '-'} · Proyecto: {row.proyecto || '-'}
                            </p>
                          </button>
                        ))
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-3">
                      <span className="text-xs font-medium text-slate-400">{searchMeta?.total ? `${searchMeta.total} resultados encontrados` : 'Búsqueda global de activos'}</span>
                      <button type="button" onClick={clearSearch} className="text-xs font-bold text-slate-500 hover:text-red-600">Cerrar y limpiar</button>
                    </div>
                  </div>
                )}
              </form>
            </div>

            <div className="flex shrink-0 items-center gap-4">
              <NotificationPopover />

              <Menu as="div" className="relative">
                <Menu.Button className="flex min-w-52 items-center border-l border-slate-200 py-2 pl-6 pr-2 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  <span className="sr-only">Abrir menú de usuario</span>
                  <div className="min-w-0">
                    <p className="max-w-56 truncate text-sm font-bold text-slate-900">{userDisplayName}</p>
                    <p className="max-w-56 truncate text-sm font-medium text-slate-500">{userDisplayRole}</p>
                  </div>
                </Menu.Button>

                <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                  <Menu.Items className="absolute right-0 mt-2 w-64 origin-top-right divide-y divide-slate-100 rounded-xl bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sesión activa</p>
                      <p className="mt-1 truncate text-sm font-bold text-slate-900">{userDisplayName}</p>
                      <p className="truncate text-xs font-medium text-slate-500">{user.email || userDisplayRole}</p>
                    </div>
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button onClick={handleLogout} className={classNames(active ? 'bg-red-50' : '', 'block w-full px-4 py-2 text-left text-sm font-bold text-red-600 transition-colors')}>
                            Cerrar sesión
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>

        <main className="relative flex-1 overflow-y-auto bg-slate-50/50">
          <div className="py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SearchInput({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50" />
    </label>
  );
}

function SearchSelect({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50">
        <option value="">Todos</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
