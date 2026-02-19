import { useState, useEffect } from 'react'
import { supabase } from '../database/supabase'
import TablaInventario from '../components/inventario/TablaInventario'
import ModalEntradaInventario from '../components/inventario/ModalEntradaInventario'
import ModalEditarInventario from '../components/inventario/ModalEditarInventario'
import ModalEliminarInventario from '../components/inventario/ModalEliminarInventario'
import '../components/inventario/TablaInventario.css'
import '../components/inventario/Inventario.css'

const Inventario = () => {
  const [inventario, setInventario] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  
  // Estados para modales
  const [modalAgregarAbierto, setModalAgregarAbierto] = useState(false)
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false)
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false)
  
  // Estados para datos de formularios
  const [nuevaEntrada, setNuevaEntrada] = useState({
    producto_id: '',
    entrada: 1
  })
  
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      setErrorCarga('')
      
      console.log('Iniciando carga de datos...')
      
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
      
      // PRIMERO: Intentar sin la relación para ver si funciona
      const { data: inventarioData, error: errorInventario } = await supabase
        .from('inventario')
        .select('*')
        .order('fecha', { ascending: false })
      
      console.log('Inventario cargado (sin relación):', inventarioData)
      
      if (errorInventario) {
        console.error('Error cargando inventario básico:', errorInventario)
        throw errorInventario
      }
      
      // Ahora, si necesitas los datos del producto, los combinamos manualmente
      const inventarioConProductos = inventarioData.map(item => {
        const producto = productosData?.find(p => p.id === item.producto_id)
        return {
          ...item,
          productos: producto || null
        }
      })
      
      setInventario(inventarioConProductos || [])
      
    } catch (error) {
      console.error('Error cargando inventario:', error)
      setErrorCarga(`Error al cargar datos: ${error.message}`)
      alert('Error al cargar datos del inventario')
    } finally {
      setLoading(false)
    }
  }

  // Funciones para abrir modales
  const abrirModalAgregar = () => {
    setNuevaEntrada({ producto_id: '', entrada: 1 })
    setModalAgregarAbierto(true)
  }

  const abrirModalEditar = (registro) => {
    setRegistroSeleccionado(registro)
    setModalEditarAbierto(true)
  }

  const abrirModalEliminar = (registro) => {
    setRegistroSeleccionado(registro)
    setModalEliminarAbierto(true)
  }

  // Función para cerrar todos los modales
  const cerrarModales = () => {
    setModalAgregarAbierto(false)
    setModalEditarAbierto(false)
    setModalEliminarAbierto(false)
    setRegistroSeleccionado(null)
  }

  // Función para manejar entrada registrada
  const handleEntradaRegistrada = async (entradaData) => {
    console.log('Datos a guardar:', entradaData)
    
    try {
      // Opción 1: Usar la fecha ACTUAL del servidor
      const datosConFecha = {
        ...entradaData,
        fecha: new Date().toISOString()
      };
      
      console.log('Fecha que se enviará:', datosConFecha.fecha)
      
      const { data, error } = await supabase
        .from('inventario')
        .insert([datosConFecha])
        .select()
      
      console.log('Respuesta Supabase:', { data, error })
      
      if (error) {
        console.error('Error detallado:', error)
        throw error
      }
      
      alert('✅ Entrada de inventario registrada correctamente')
      cerrarModales()
      cargarDatos()
    } catch (error) {
      console.error('Error completo:', error)
      alert(`❌ Error: ${error.message}`)
      throw error
    }
  }

  // Función para manejar entrada editada
  const handleEntradaEditada = async (datosActualizados) => {
    try {
      // Agregar fecha de edición
      const datosCompletos = {
        ...datosActualizados,
        fecha_edicion: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('inventario')
        .update(datosCompletos)
        .eq('id', registroSeleccionado.id)
      
      if (error) throw error
      
      alert('✅ Entrada de inventario actualizada correctamente')
      cerrarModales()
      cargarDatos()
    } catch (error) {
      console.error('Error actualizando entrada:', error)
      alert('❌ Error al actualizar entrada')
      throw error
    }
  }

  // Función para manejar entrada eliminada
  const handleEntradaEliminada = async () => {
    try {
      const { error } = await supabase
        .from('inventario')
        .delete()
        .eq('id', registroSeleccionado.id)
      
      if (error) throw error
      
      alert('✅ Entrada de inventario eliminada correctamente')
      cerrarModales()
      cargarDatos()
    } catch (error) {
      console.error('Error eliminando entrada:', error)
      alert('❌ Error al eliminar entrada')
      throw error
    }
  }

  // Calcular resumen
  const calcularResumen = () => {
    if (!inventario || inventario.length === 0) {
      return {
        totalEntradas: 0,
        totalProductos: 0,
        valorTotal: 0
      }
    }

    const totalEntradas = inventario.length
    const productosUnicos = [...new Set(inventario.map(item => item.producto_id))].length
    
    const valorTotal = inventario.reduce((sum, item) => {
      const precio = item.productos?.precio || 0
      return sum + (precio * item.entrada)
    }, 0)

    return {
      totalEntradas,
      totalProductos: productosUnicos,
      valorTotal
    }
  }

  const resumen = calcularResumen()

  return (
    <div className="inventario-container">
      {/* Header responsive */}
      <div className="inventario-header">
        <div className="inventario-titulo-container">
          <h1 className="inventario-titulo">Inventario</h1>
          <p className="inventario-subtitulo">Registro de entradas al inventario</p>
        </div>
        
        <div className="inventario-botones-header">
          <button
            onClick={abrirModalAgregar}
            className="boton-agregar-inventario"
            disabled={loading}
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
            Nueva Entrada
          </button>
        </div>
      </div>

      {errorCarga && (
        <div className="error-carga">
          <p>{errorCarga}</p>
          <button onClick={cargarDatos} className="btn-reintentar">
            Reintentar
          </button>
        </div>
      )}

      {/* Resumen de inventario responsive */}
      <div className="resumen-inventario-grid">
        <div className="resumen-card inventario-card">
          <div className="resumen-card-content">
            <span className="resumen-card-label">TOTAL ENTRADAS</span>
            <strong className="resumen-card-value">{resumen.totalEntradas}</strong>
          </div>
          <div className="resumen-card-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>
        
        <div className="resumen-card productos-card">
          <div className="resumen-card-content">
            <span className="resumen-card-label">PRODUCTOS</span>
            <strong className="resumen-card-value">{resumen.totalProductos}</strong>
          </div>
          <div className="resumen-card-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
        </div>
        
        <div className="resumen-card valor-card">
          <div className="resumen-card-content">
            <span className="resumen-card-label">VALOR TOTAL</span>
            <strong className="resumen-card-value">
              C${resumen.valorTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="resumen-card-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <TablaInventario
        inventario={inventario}
        loading={loading}
        onEditar={abrirModalEditar}
        onEliminar={abrirModalEliminar}
      />

      {/* Modales */}
      <ModalEntradaInventario
        isOpen={modalAgregarAbierto}
        onClose={cerrarModales}
        onSave={handleEntradaRegistrada}
        productos={productos}
        entradaData={nuevaEntrada}
        setEntradaData={setNuevaEntrada}
      />

      <ModalEditarInventario
        isOpen={modalEditarAbierto}
        onClose={cerrarModales}
        onSave={handleEntradaEditada}
        registro={registroSeleccionado}
        productos={productos}
      />

      <ModalEliminarInventario
        isOpen={modalEliminarAbierto}
        onClose={cerrarModales}
        onConfirm={handleEntradaEliminada}
        registro={registroSeleccionado}
      />
    </div>
  )
}

export default Inventario