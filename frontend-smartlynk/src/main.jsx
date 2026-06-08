import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import './index.css';

import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import CatalogoVehiculos from './pages/flotilla/CatalogoVehiculos';
import RegistroMantenimientos from './pages/flotilla/RegistroMantenimientos';
import GastosExtra from './pages/flotilla/GastosExtra';
import BitacoraViajes from './pages/flotilla/BitacoraViajes';
import DashboardFlotilla from './pages/flotilla/DashboardFlotilla';
import Kilometraje from './pages/flotilla/Kilometraje';

import DashboardAlmacen from './pages/Dashboard/Index';
import AlmacenIndex from './pages/Almacen/Index';
import AlmacenEntrada from './pages/Almacen/Entrada';
import AlmacenSalida from './pages/Almacen/Salida';
import AlmacenMovimientos from './pages/Almacen/Movimientos';
import EmpleadosIndex from './pages/Empleados/Index';

function PrivatePage({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Grupo de rutas protegidas con Layout fijo */}
        <Route element={<PrivatePage><Layout /></PrivatePage>}>
          <Route path="/dashboard" element={<DashboardAlmacen />} />
          <Route path="/almacen" element={<Navigate to="/almacen/articulos" replace />} />
          <Route path="/almacen/articulos" element={<AlmacenIndex />} />
          <Route path="/almacen/entrada" element={<AlmacenEntrada />} />
          <Route path="/almacen/salida" element={<AlmacenSalida />} />
          <Route path="/almacen/movimientos" element={<AlmacenMovimientos />} />
          <Route path="/empleados" element={<EmpleadosIndex />} />
          <Route path="/catalogo" element={<div className="p-8">Catalogo (pendiente de migrar)</div>} />
          <Route path="/mostrador" element={<div className="p-8 text-slate-500">Modulo de Mostrador (En desarrollo)</div>} />
          
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
