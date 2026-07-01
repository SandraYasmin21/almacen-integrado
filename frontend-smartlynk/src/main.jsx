import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import DashboardAlmacen from './pages/Dashboard/Index';
import AlmacenDashboard from "./pages/Almacen/AlmacenDashboard"; 
import OrdenesCompra from './pages/Almacen/OrdenesCompra';
import AdministracionActivos from './pages/Activos/AdministracionActivos';

import EmpleadosIndex from './pages/Empleados/Index';
import UsuariosSistema from './pages/Empleados/UsuariosSistema';

import CatalogoCentral from './pages/CatalogoCentral/Index';
import CatalogosConfigurables from './pages/Admin/CatalogosConfigurables';
import Ubicaciones from './pages/Admin/Ubicaciones';
import ProyectosIndex from './pages/Proyectos/Index';

import ReportesBasicos from './pages/Reportes/Basicos';
import ReportesVehiculares from './pages/Reportes/Vehiculares';

import DetalleMovimientoMostrador from './pages/Mostrador/DetalleMovimiento';
import TerminalEscaner from './pages/Mostrador/TerminalEscaner';
import ResguardosPrestamos from './pages/Mostrador/ResguardosPrestamos';
import Devoluciones from './pages/Mostrador/Devoluciones';
import OrdenesMostrador from './pages/Mostrador/Ordenes';

import VentasOcasionales from './pages/Operaciones/VentasOcasionales';
import GestorDocumental from './pages/Operaciones/GestorDocumental';
import HojasEntrega from './pages/Operaciones/HojasEntrega';

import CatalogoVehiculos from './pages/flotilla/CatalogoVehiculos';
import RegistroMantenimientos from './pages/flotilla/RegistroMantenimientos';
import GastosExtra from './pages/flotilla/GastosExtra';
import BitacoraViajes from './pages/flotilla/BitacoraViajes';
import DashboardFlotilla from './pages/flotilla/DashboardFlotilla';
import Kilometraje from './pages/flotilla/Kilometraje';

import KioscoLogin from './pages/Kiosco/KioscoLogin';
import KioscoMenu from './pages/Kiosco/KioscoMenu';
import KioscoResguardos from './pages/Kiosco/KioscoResguardos';
import KioscoPrestamos from './pages/Kiosco/KioscoPrestamos';
import KioscoFlotilla from './pages/Kiosco/KioscoFlotilla';

function PrivatePage({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Rutas Standalone (Kiosco) */}
        <Route path="/kiosco/login" element={<KioscoLogin />} />
        <Route path="/kiosco/menu" element={<KioscoMenu />} />
        <Route path="/kiosco/prestamos" element={<KioscoPrestamos />} />
        <Route path="/kiosco/vehiculos" element={<KioscoFlotilla />} />
        <Route path="/kiosco/resguardos" element={<KioscoResguardos />} />

        {/* Grupo de rutas protegidas con Layout fijo */}
        <Route element={<PrivatePage><Layout /></PrivatePage>}>
          <Route path="/dashboard" element={<DashboardAlmacen />} />
          <Route path="/activos" element={<Navigate to="/activos/recepcion" replace />} />
          <Route path="/activos/inventario" element={<AdministracionActivos section="inventario" />} />
          <Route path="/activos/recepcion" element={<AdministracionActivos section="recepcion" />} />
          <Route path="/activos/movimientos" element={<AdministracionActivos section="movimientos" />} />
          <Route path="/almacen" element={<Navigate to="/activos/recepcion" replace />} />
          <Route path="/almacen/stock" element={<Navigate to="/activos/inventario" replace />} />
          <Route path="/almacen/articulos" element={<Navigate to="/activos/inventario" replace />} />
          <Route path="/almacen/recepcion" element={<Navigate to="/activos/recepcion" replace />} />
          <Route path="/almacen/dashboard" element={<AlmacenDashboard />} />
          <Route path="/almacen/entrada" element={<Navigate to="/activos/recepcion" replace />} />
          <Route path="/almacen/salida" element={<Navigate to="/mostrador/terminal" replace />} />
          <Route path="/almacen/ordenes-compra" element={<OrdenesCompra />} />
          <Route path="/almacen/ajustes" element={<Navigate to="/activos/movimientos" replace />} />
          <Route path="/almacen/movimientos" element={<Navigate to="/activos/movimientos" replace />} />
          <Route path="/almacen/historial" element={<Navigate to="/activos/movimientos" replace />} />
          
          <Route path="/empleados" element={<Navigate to="/empleados/directorio" replace />} />
          <Route path="/empleados/directorio" element={<EmpleadosIndex view="directorio" />} />
          <Route path="/empleados/resguardos" element={<EmpleadosIndex view="resguardos" />} />
          <Route path="/empleados/prestamos" element={<EmpleadosIndex view="prestamos" />} />
          <Route path="/admin/usuarios-sistema" element={<UsuariosSistema />} />
          
          <Route path="/catalogo" element={<CatalogoCentral />} />
          <Route path="/catalogo/configurables" element={<CatalogosConfigurables />} />
          <Route path="/admin/ubicaciones" element={<Ubicaciones />} />
          <Route path="/proyectos" element={<ProyectosIndex />} />
          
          <Route path="/reportes/basicos" element={<ReportesBasicos />} />
          <Route path="/reportes/vehiculares" element={<ReportesVehiculares />} />

          <Route path="/mostrador">
            <Route index element={<Navigate to="/mostrador/terminal" replace />} />
            <Route path="terminal" element={<TerminalEscaner />} />
            <Route path="resguardos" element={<ResguardosPrestamos />} />
            <Route path="devoluciones" element={<Devoluciones />} />
            <Route path="ordenes" element={<OrdenesMostrador />} />
            <Route path="despacho" element={<OrdenesMostrador />} />
            <Route path="entrada" element={<Navigate to="/activos/recepcion" replace />} />
            <Route path="salida" element={<Navigate to="/mostrador/terminal" replace />} />
            <Route path="registrar" element={<Navigate to="/mostrador/terminal" replace />} />
            <Route path="movimientos/:id" element={<DetalleMovimientoMostrador />} />
            <Route path="*" element={<Navigate to="/mostrador/terminal" replace />} />
          </Route>
          
          <Route path="/operaciones/ventas-ocasionales" element={<VentasOcasionales />} />
          <Route path="/operaciones/gestor-documental" element={<GestorDocumental />} />
          <Route path="/operaciones/hojas-entrega" element={<HojasEntrega />} />
          <Route path="/flotilla" element={<Navigate to="/flotilla/dashboard" replace />} />
          <Route path="/flotilla/vehiculos" element={<CatalogoVehiculos />} />
          <Route path="/flotilla/mantenimientos" element={<RegistroMantenimientos />} />
          <Route path="/flotilla/gastos" element={<GastosExtra />} />
          <Route path="/flotilla/bitacora" element={<BitacoraViajes />} />
          <Route path="/flotilla/dashboard" element={<DashboardFlotilla />} />
          <Route path="/flotilla/kilometraje" element={<Kilometraje />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
