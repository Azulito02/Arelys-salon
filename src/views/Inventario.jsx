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
      
      // OPCIONAL: Si quieres intentar con la relación, usa este código alternativo:
      /*
      try {
        const { data: inventarioData, error: errorInventario } = await supabase
          .from('inventario')
          .select(`
            *,
            producto:productos(id, nombre, precio, codigo)
          `)
          .order('fecha', { ascending: false })
        
        if (errorInventario) throw errorInventario
        
        // Renombrar la propiedad para que sea consistente
        const inventarioFormateado = inventarioData.map(item => ({
          ...item,
          productos: item.producto
        }))
        
        setInventario(inventarioFormateado || [])
      } catch (relError) {
        console.log('Usando método manual:', relError.message)
        // Usar el método manual si falla la relación
        setInventario(inventarioData || [])
      }
      */
      
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

 // Cuando insertas un registro en el inventario
// Función para manejar entrada registrada - VERSIÓN CORREGIDA
const handleEntradaRegistrada = async (entradaData) => {
  console.log('Datos a guardar:', entradaData)
  
  try {
    // Opción 1: Usar la fecha ACTUAL del servidor (la más simple)
    const datosConFecha = {
      ...entradaData,
      fecha: new Date().toISOString() // ESTA ES LA CLAVE - usar new Date() sin conversiones
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
      fecha_edicion: new Date().toISOString() // Guardar fecha actual de edición
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

  return (
    <div className="inventario-container">
      <div className="inventario-header">
        <div className="inventario-titulo-container">
          <h1 className="inventario-titulo">Inventario</h1>
          <p className="inventario-subtitulo">Registro de entradas al inventario</p>
        </div>
        <button
          onClick={abrirModalAgregar}
          className="boton-agregar-inventario"
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

      {errorCarga && (
        <div className="error-carga">
          <p>{errorCarga}</p>
          <button onClick={cargarDatos} className="btn-reintentar">
            Reintentar
          </button>
        </div>
      )}

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
