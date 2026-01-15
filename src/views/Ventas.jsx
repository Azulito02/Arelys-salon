// Ventas.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../database/supabase'
import TablaVentas from '../components/ventas/TablaVentas'
import ModalNuevaVenta from '../components/ventas/ModalNuevaVenta'
import ModalEditarVenta from '../components/ventas/ModalEditarVenta'
import ModalEliminarVenta from '../components/ventas/ModalEliminarVenta'
import '../components/ventas/TablaVentas.css'
import '../components/ventas/Ventas.css'

const Ventas = () => {
  const [ventas, setVentas] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  
  // Estados para modales
  const [modalNuevaAbierto, setModalNuevaAbierto] = useState(false)
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false)
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false)
  
  // Estados para datos de formularios
  const [nuevaVenta, setNuevaVenta] = useState({
    producto_id: '',
    cantidad: 1,
    precio_unitario: 0,
    total: 0
  })
  
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      setErrorCarga('')
      
      console.log('Iniciando carga de datos de ventas...')
      
      // Cargar productos para el select
      const { data: productosData, error: errorProductos } = await supabase
        .from('productos')
        .select('*')
        .order('nombre')
      
      console.log('Productos cargados:', productosData)
      
      if (errorProductos) {
        console.error('Error cargando productos:', errorProductos)
        throw errorProductos
      }
      setProductos(productosData || [])
      
      // Cargar ventas con información de productos
      const { data: ventasData, error: errorVentas } = await supabase
        .from('ventas')
        .select('*')
        .order('fecha', { ascending: false })
      
      console.log('Ventas cargadas:', ventasData)
      
      if (errorVentas) {
        console.error('Error cargando ventas:', errorVentas)
        throw errorVentas
      }
      
      // Combinar con información de productos
      const ventasConProductos = ventasData.map(venta => {
        const producto = productosData?.find(p => p.id === venta.producto_id)
        return {
          ...venta,
          productos: producto || null
        }
      })
      
      setVentas(ventasConProductos || [])
      
    } catch (error) {
      console.error('Error cargando ventas:', error)
      setErrorCarga(`Error al cargar datos: ${error.message}`)
      alert('Error al cargar datos de ventas')
    } finally {
      setLoading(false)
    }
  }

  // Funciones para abrir modales
  const abrirModalNueva = () => {
    setNuevaVenta({
      producto_id: '',
      cantidad: 1,
      precio_unitario: 0,
      total: 0
    })
    setModalNuevaAbierto(true)
  }

  const abrirModalEditar = (venta) => {
    setVentaSeleccionada(venta)
    setModalEditarAbierto(true)
  }

  const abrirModalEliminar = (venta) => {
    setVentaSeleccionada(venta)
    setModalEliminarAbierto(true)
  }

  // Función para cerrar todos los modales
  const cerrarModales = () => {
    setModalNuevaAbierto(false)
    setModalEditarAbierto(false)
    setModalEliminarAbierto(false)
    setVentaSeleccionada(null)
  }

  // Función para manejar nueva venta
  const handleVentaRegistrada = async (ventaData) => {
    console.log('Datos de venta a guardar:', ventaData)
    
    try {
      const { data, error } = await supabase
        .from('ventas')
        .insert([ventaData])
        .select()
      
      console.log('Respuesta Supabase:', { data, error })
      
      if (error) {
        console.error('Error detallado:', error)
        throw error
      }
      
      alert('✅ Venta registrada correctamente')
      cerrarModales()
      cargarDatos()
    } catch (error) {
      console.error('Error completo:', error)
      alert(`❌ Error: ${error.message}`)
      throw error
    }
  }

  // Función para manejar venta editada
  const handleVentaEditada = async (datosActualizados) => {
    try {
      const { error } = await supabase
        .from('ventas')
        .update(datosActualizados)
        .eq('id', ventaSeleccionada.id)
      
      if (error) throw error
      
      alert('✅ Venta actualizada correctamente')
      cerrarModales()
      cargarDatos()
    } catch (error) {
      console.error('Error actualizando venta:', error)
      alert(`❌ Error: ${error.message}`)
      throw error
    }
  }

  // Función para manejar venta eliminada
  const handleVentaEliminada = async () => {
    try {
      const { error } = await supabase
        .from('ventas')
        .delete()
        .eq('id', ventaSeleccionada.id)
      
      if (error) throw error
      
      alert('✅ Venta eliminada correctamente')
      cerrarModales()
      cargarDatos()
    } catch (error) {
      console.error('Error eliminando venta:', error)
      alert(`❌ Error: ${error.message}`)
      throw error
    }
  }

  // Calcular estadísticas
  const totalVentas = ventas.reduce((sum, venta) => sum + venta.total, 0)
  const totalUnidades = ventas.reduce((sum, venta) => sum + venta.cantidad, 0)
  const ventasEfectivo = ventas.filter(v => v.metodo_pago === 'efectivo' || v.metodo_pago === 'mixto')
    .reduce((sum, venta) => sum + (venta.efectivo || 0), 0)
  const ventasTarjeta = ventas.filter(v => v.metodo_pago === 'tarjeta' || v.metodo_pago === 'mixto')
    .reduce((sum, venta) => sum + (venta.tarjeta || 0), 0)
  const ventasTransferencia = ventas.filter(v => v.metodo_pago === 'transferencia' || v.metodo_pago === 'mixto')
    .reduce((sum, venta) => sum + (venta.transferencia || 0), 0)

  return (
    <div className="ventas-container">
      <div className="ventas-header">
        <div className="ventas-titulo-container">
          <h1 className="ventas-titulo">Ventas</h1>
          <p className="ventas-subtitulo">Registro de ventas de productos</p>
        </div>
        <button
          onClick={abrirModalNueva}
          className="boton-agregar-venta"
        >
          <svg 
            className="boton-agregar-icono" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            width="20"
            height="20"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2.5} 
              d="M12 4v16m8-8H4" 
            />
          </svg>
          Nueva Venta
        </button>
      </div>

      {errorCarga && (
        <div className="error-carga">
          <p>{errorCarga}</p>
          <button onClick={cargarDatos} className="btn-reintentar">
            Reintentar
          </button>
        </div>
      )}

      <TablaVentas
        ventas={ventas}
        loading={loading}
        onEditar={abrirModalEditar}
        onEliminar={abrirModalEliminar}
      />

      {/* Resumen de ventas */}
      {!loading && ventas.length > 0 && (
        <div className="resumen-ventas">
          <div className="resumen-card">
            <h3 className="resumen-titulo">Resumen de Ventas</h3>
            <div className="resumen-stats">
              <div className="stat-item">
                <span className="stat-label">Total Ventas:</span>
                <span className="stat-value">${totalVentas.toFixed(2)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Unidades Vendidas:</span>
                <span className="stat-value">{totalUnidades} unidades</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Transacciones:</span>
                <span className="stat-value">{ventas.length} registros</span>
              </div>
            </div>
            
            <div className="separador"></div>
            
            <h4 className="resumen-subtitulo">Distribución por Método de Pago:</h4>
            <div className="resumen-stats-metodos">
              <div className="stat-metodo-item">
                <span className="stat-metodo-label">💰 Efectivo:</span>
                <span className="stat-metodo-valor">${ventasEfectivo.toFixed(2)}</span>
              </div>
              <div className="stat-metodo-item">
                <span className="stat-metodo-label">💳 Tarjeta:</span>
                <span className="stat-metodo-valor">${ventasTarjeta.toFixed(2)}</span>
              </div>
              <div className="stat-metodo-item">
                <span className="stat-metodo-label">🏦 Transferencia:</span>
                <span className="stat-metodo-valor">${ventasTransferencia.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modales */}
      <ModalNuevaVenta
        isOpen={modalNuevaAbierto}
        onClose={cerrarModales}
        onSave={handleVentaRegistrada}
        productos={productos}
        ventaData={nuevaVenta}
        setVentaData={setNuevaVenta}
      />

      <ModalEditarVenta
        isOpen={modalEditarAbierto}
        onClose={cerrarModales}
        onSave={handleVentaEditada}
        venta={ventaSeleccionada}
        productos={productos}
      />

      <ModalEliminarVenta
        isOpen={modalEliminarAbierto}
        onClose={cerrarModales}
        onConfirm={handleVentaEliminada}
        venta={ventaSeleccionada}
      />
    </div>
  )
}

export default Ventas