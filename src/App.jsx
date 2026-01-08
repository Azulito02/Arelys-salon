import { Routes, Route } from "react-router-dom";
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
  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/" element={<Login />} />

      {/* Rutas protegidas */}
      <Route element={<RutasProtegidas />}>
        <Route path="/inicio" element={<Inicio />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/ventas" element={<Ventas />} />
        <Route path="/creditos" element={<Creditos />} />
        <Route path="/abonos" element={<Abonos />} />
        <Route path="/gastos" element={<Gastos />} />
        <Route path="/arqueos" element={<Arqueos />} />
      </Route>
    </Routes>
  );
}