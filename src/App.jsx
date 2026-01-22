import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom"; // Elimina BrowserRouter
import Login from "./views/Login";
import RutasProtegidas from "./RutasProtegidas";
import Inicio from "./views/Inicio";
import Productos from "./views/Productos";
import Inventario from "./views/Inventario";
import Ventas from "./views/Ventas";
import Creditos from "./views/Creditos";
import Abonos from "./views/Abonos";
import Gastos from "./views/Gastos";
import Arqueos from "./views/Arqueos";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    // Verificar autenticación al cargar la app
    const usuario = JSON.parse(localStorage.getItem('usuarioArelyz'));
    setIsAuthenticated(!!usuario);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('usuarioArelyz');
    setIsAuthenticated(false);
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    // SIN BrowserRouter aquí
    <Routes>
      {/* Ruta pública */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? 
            <Navigate to="/inicio" replace /> : 
            <Login onLogin={handleLogin} />
        } 
      />

      {/* Rutas protegidas */}
      <Route 
        element={
          <RutasProtegidas 
            onLogout={handleLogout}
            isAuthenticated={isAuthenticated}
          />
        }
      >
        <Route path="/inicio" element={<Inicio />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/ventas" element={<Ventas />} />
        <Route path="/creditos" element={<Creditos />} />
        <Route path="/abonos" element={<Abonos />} />
        <Route path="/gastos" element={<Gastos />} />
        <Route path="/arqueos" element={<Arqueos />} />
      </Route>

      {/* Ruta para manejar rutas no encontradas */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}