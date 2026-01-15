import { useState, useEffect } from 'react'
import { supabase } from '../database/supabase'
import TablaProductos from '../components/producto/TablaProductos'
import ModalAgregarProducto from '../components/producto/ModalAgregarProducto'
import ModalEditarProducto from '../components/producto/ModalEditarProducto'
import ModalEliminarProducto from '../components/producto/ModalEliminarProducto'
import '../components/producto/TablaProductos.css'

const Productos = () => {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAgregarAbierto, setModalAgregarAbierto] = useState(false)
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false)
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false)
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)

  useEffect(() => {
    cargarProductos()
  }, [])

  const cargarProductos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('nombre')
      
      if (error) throw error
      setProductos(data || [])
    } catch (error) {
      console.error('Error cargando productos:', error)
      alert('Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }

  // Funciones para abrir modales
  const abrirModalAgregar = () => {
    setModalAgregarAbierto(true)
  }

  const abrirModalEditar = (producto) => {
    setProductoSeleccionado(producto)
    setModalEditarAbierto(true)
  }

  const abrirModalEliminar = (producto) => {
    setProductoSeleccionado(producto)
    setModalEliminarAbierto(true)
  }

  // Función para cerrar modales
  const cerrarModales = () => {
    setModalAgregarAbierto(false)
    setModalEditarAbierto(false)
    setModalEliminarAbierto(false)
    setProductoSeleccionado(null)
  }

  // Función para manejar producto agregado
  const handleProductoAgregado = async (productoData) => {
    try {
      const { error } = await supabase
        .from('productos')
        .insert([productoData])
      
      if (error) throw error
      
      alert('✅ Producto agregado correctamente')
      cerrarModales()
      cargarProductos()
    } catch (error) {
      console.error('Error agregando producto:', error)
      alert(`❌ Error al agregar producto: ${error.message}`)
    }
  }

  // Función para manejar producto editado
  const handleProductoEditado = async (productoData) => {
    try {
      const { error } = await supabase
        .from('productos')
        .update(productoData)
        .eq('id', productoSeleccionado.id)
      
      if (error) throw error
      
      alert('✅ Producto actualizado correctamente')
      cerrarModales()
      cargarProductos()
    } catch (error) {
      console.error('Error actualizando producto:', error)
      alert(`❌ Error al actualizar producto: ${error.message}`)
    }
  }

  // Función para manejar producto eliminado
  const handleProductoEliminado = async () => {
    try {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', productoSeleccionado.id)
      
      if (error) throw error
      
      alert('✅ Producto eliminado correctamente')
      cerrarModales()
      cargarProductos()
    } catch (error) {
      console.error('Error eliminando producto:', error)
      alert(`❌ Error al eliminar producto: ${error.message}`)
    }
  }

  // Estadísticas
  const categoriasUnicas = [...new Set(productos.map(p => p.categoria || 'Sin categoría'))]
  const totalProductos = productos.length

  return (
    <div className="productos-container">
      <div className="productos-header">
        <div className="productos-titulo-container">
          <h1 className="productos-titulo">Productos</h1>
          <p className="productos-subtitulo">Gestión de productos del salón</p>
        </div>
        <button
          onClick={abrirModalAgregar}
          className="boton-agregar"
        >
          <span className="boton-agregar-icono">+</span>
          Nuevo Producto
        </button>
      </div>

      {/* Estadísticas rápidas */}
      {!loading && productos.length > 0 && (
        <div className="estadisticas-rapidas">
          <div className="estadistica-item">
            <span className="estadistica-label">Total Productos:</span>
            <span className="estadistica-valor">{totalProductos}</span>
          </div>
          <div className="estadistica-item">
            <span className="estadistica-label">Categorías:</span>
            <span className="estadistica-valor">{categoriasUnicas.length}</span>
          </div>
        </div>
      )}

      <TablaProductos
        productos={productos}
        loading={loading}
        onEditar={abrirModalEditar}
        onEliminar={abrirModalEliminar}
      />

      {/* Modales */}
      <ModalAgregarProducto
        isOpen={modalAgregarAbierto}
        onClose={cerrarModales}
        onSave={handleProductoAgregado}
      />

      <ModalEditarProducto
        isOpen={modalEditarAbierto}
        onClose={cerrarModales}
        onSave={handleProductoEditado}
        producto={productoSeleccionado}
      />

      <ModalEliminarProducto
        isOpen={modalEliminarAbierto}
        onClose={cerrarModales}
        onConfirm={handleProductoEliminado}
        producto={productoSeleccionado}
      />
    </div>
  )
}

export default Productos