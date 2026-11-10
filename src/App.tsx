import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Inicio from "./pages/Inicio/Inicio";
import Login from "./pages/Login/Login";
import Registro from "./pages/Registro/Registro";
import Productos from "./pages/Productos/Productos";
import Contactanos from "./pages/Contactanos/Contactanos";
import Carrito from "./pages/Carrito/Carrito";
import Detalle from "./pages/Detalle/Detalle";
import AdminLayout from "./pages/Admin/AdminLayout";
import AdminDashboard from "./pages/Admin/Dashboard/Dashboard";
import AdminVentas from "./pages/Admin/Ventas/Ventas";
import AdminDespachos from "./pages/Admin/Despachos/Despachos";
import AdminProductos from "./pages/Admin/Productos/Productos";
import AdminUsuarios from "./pages/Admin/Usuarios/Usuarios";
import AdminReportes from "./pages/Admin/Reportes/Reportes";
import AlmacenLayout from "./pages/Almacen/AlmacenLayout";
import AlmacenDashboard from "./pages/Almacen/Dashboard/Dashboard";
import AlmacenProductos from "./pages/Almacen/Productos/Productos";
import AlmacenEntradas from "./pages/Almacen/Entradas/Entradas";
import AlmacenKardex from "./pages/Almacen/Kardex/Kardex";
import AlmacenDespachos from "./pages/Almacen/Despachos/Despachos";
import MisCompras from "./pages/MisCompras/MisCompras";
import MiCuenta from "./pages/MiCuenta/MiCuenta";
import NotFound from "./pages/NotFound/NotFound";
import { CarritoProvider } from "./context/CarritoContext";
import { AuthProvider } from "./context/AuthContext";
import { InventarioProvider } from "./context/InventarioContext";
import { ThemeProvider } from "./context/ThemeContext";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <InventarioProvider>
          <CarritoProvider>
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<Navigate to="/inicio" replace />} />

                <Route path="/login" element={<Login />} />
                <Route path="/registro" element={<Registro />} />
                <Route path="/register" element={<Navigate to="/registro" replace />} />

                <Route path="/inicio" element={<Inicio />} />
                <Route path="/productos" element={<Productos />} />
                <Route path="/productos/:id" element={<Detalle />} />
                <Route path="/contactanos" element={<Contactanos />} />
                <Route path="/carrito" element={<Carrito />} />
                <Route path="/mis-compras" element={<MisCompras />} />
                <Route path="/mi-cuenta" element={<MiCuenta />} />

                <Route path="/Inicio" element={<Navigate to="/inicio" replace />} />
                <Route path="/Productos" element={<Navigate to="/productos" replace />} />
                <Route path="/Contactanos" element={<Navigate to="/contactanos" replace />} />
                <Route path="/Carrito" element={<Navigate to="/carrito" replace />} />
                <Route path="/MisCompras" element={<Navigate to="/mis-compras" replace />} />
                <Route path="/MiCuenta" element={<Navigate to="/mi-cuenta" replace />} />
                <Route path="/Admin/*" element={<Navigate to="/admin" replace />} />

                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="ventas" element={<AdminVentas />} />
                  <Route path="despachos" element={<AdminDespachos />} />
                  <Route path="productos" element={<AdminProductos />} />
                  <Route path="usuarios" element={<AdminUsuarios />} />
                  <Route path="reportes" element={<AdminReportes />} />
                </Route>

                <Route path="/almacen" element={<AlmacenLayout />}>
                  <Route index element={<AlmacenDashboard />} />
                  <Route path="dashboard" element={<AlmacenDashboard />} />
                  <Route path="productos" element={<AlmacenProductos />} />
                  <Route path="entradas" element={<AlmacenEntradas />} />
                  <Route path="kardex" element={<AlmacenKardex />} />
                  <Route path="despachos" element={<AlmacenDespachos />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </CarritoProvider>
        </InventarioProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

