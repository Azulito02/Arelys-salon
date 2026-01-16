import { useState, useEffect } from 'react'
import { supabase } from '../database/supabase'
import TablaGastos from '../components/gastos/TablaGastos'
import ModalAgregarGasto from '../components/gastos/ModalAgregarGasto'
import ModalEditarGasto from '../components/gastos/ModalEditarGasto'
import ModalEliminarGasto from '../components/gastos/ModalEliminarGasto'
import '../components/gastos/Gastos.css'

const Gastos = () => {
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Estados para modales
  const [showAgregarModal, setShowAgregarModal] = useState(false)
  const [showEditarModal, setShowEditarModal] = useState(false)
  const [showEliminarModal, setShowEliminarModal] = useState(false)
  const [gastoSeleccionado, setGastoSeleccionado] = useState(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('gastos')
        .select('*')
        .order('fecha', { ascending: false })
      
      if (error) throw error
      setGastos(data || [])
    } catch (error) {
      console.error('Error cargando gastos:', error)
      alert('Error al cargar gastos')
    } finally {
      setLoading(false)
    }
  }

  // Funciones para abrir modales
  const handleAgregarGasto = () => {
    setShowAgregarModal(true)
  }

  const handleEditarGasto = (gasto) => {
    setGastoSeleccionado(gasto)
    setShowEditarModal(true)
  }

  const handleEliminarGasto = (gasto) => {
    setGastoSeleccionado(gasto)
    setShowEliminarModal(true)
  }

  // Funciones para cerrar modales
  const handleCerrarAgregarModal = () => {
    setShowAgregarModal(false)
  }

  const handleCerrarEditarModal = () => {
    setGastoSeleccionado(null)
    setShowEditarModal(false)
  }

  const handleCerrarEliminarModal = () => {
    setGastoSeleccionado(null)
    setShowEliminarModal(false)
  }

  // Funciones para manejar operaciones
  const handleGastoAgregado = async (gastoData) => {
    try {
      const { error } = await supabase
        .from('gastos')
        .insert([{
          descripcion: gastoData.descripcion,
          monto: parseFloat(gastoData.monto)
        }])
      
      if (error) throw error
      
      alert('Gasto registrado correctamente')
      cargarDatos()
      setShowAgregarModal(false)
    } catch (error) {
      console.error('Error registrando gasto:', error)
      alert('Error al registrar gasto')
    }
  }

  const handleGastoEditado = async (gastoId, gastoData) => {
    try {
      const { error } = await supabase
        .from('gastos')
        .update({
          descripcion: gastoData.descripcion,
          monto: parseFloat(gastoData.monto)
        })
        .eq('id', gastoId)
      
      if (error) throw error
      
      alert('Gasto actualizado correctamente')
      cargarDatos()
      setShowEditarModal(false)
    } catch (error) {
      console.error('Error actualizando gasto:', error)
      alert('Error al actualizar gasto')
    }
  }

  const handleGastoEliminado = async (gastoId) => {
    try {
      const { error } = await supabase
        .from('gastos')
        .delete()
        .eq('id', gastoId)
      
      if (error) throw error
      
      alert('Gasto eliminado correctamente')
      cargarDatos()
      setShowEliminarModal(false)
    } catch (error) {
      console.error('Error eliminando gasto:', error)
      alert('Error al eliminar gasto')
    }
  }

  // Calcular resumen
  const calcularResumen = () => {
    const totalGastos = gastos.length
    const totalMonto = gastos.reduce((sum, gasto) => sum + parseFloat(gasto.monto), 0)
    
    // Gastos del mes actual
    const hoy = new Date()
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const gastosEsteMes = gastos.filter(gasto => 
      new Date(gasto.fecha) >= inicioMes
    )
    const totalMes = gastosEsteMes.reduce((sum, gasto) => sum + parseFloat(gasto.monto), 0)
    
    // Gasto promedio
    const promedio = totalGastos > 0 ? totalMonto / totalGastos : 0

    return {
      totalGastos,
      totalMonto,
      totalMes,
      promedio,
      gastosEsteMes: gastosEsteMes.length
    }
  }

  const resumen = calcularResumen()

  return (
    <div className="gastos-container">
      {/* Encabezado */}
      <div className="gastos-header">
        <div>
          <h1 className="gastos-titulo">Gastos</h1>
          <p className="gastos-subtitulo">Registro y seguimiento de gastos del salón</p>
        </div>
        <button
          onClick={handleAgregarGasto}
          className="btn-agregar-gasto"
        >
          <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Gasto
        </button>
      </div>

      {/* Tarjetas de resumen */}
      <div className="resumen-gastos-grid">
        <div className="resumen-card gasto-card">
          <div className="resumen-card-content">
            <span className="resumen-card-label">Total Gastos</span>
            <strong className="resumen-card-value">{resumen.totalGastos}</strong>
            <div className="resumen-card-sub">
              <span>{resumen.gastosEsteMes} este mes</span>
            </div>
          </div>
          <div className="resumen-card-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
        
        <div className="resumen-card monto-card">
          <div className="resumen-card-content">
            <span className="resumen-card-label">Monto Total</span>
            <strong className="resumen-card-value total-monto-gastos">
              -C${resumen.totalMonto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="resumen-card-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <div className="resumen-card promedio-card">
          <div className="resumen-card-content">
            <span className="resumen-card-label">Gasto Promedio</span>
            <strong className="resumen-card-value">
              C${resumen.promedio.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="resumen-card-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
        
        <div className="resumen-card mes-card">
          <div className="resumen-card-content">
            <span className="resumen-card-label">Gastos Este Mes</span>
            <strong className="resumen-card-value">
              -C${resumen.totalMes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="resumen-card-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Tabla de gastos */}
      <TablaGastos
        gastos={gastos}
        loading={loading}
        onEditar={handleEditarGasto}
        onEliminar={handleEliminarGasto}
      />

      {/* Modales */}
      {showAgregarModal && (
        <ModalAgregarGasto
          isOpen={showAgregarModal}
          onClose={handleCerrarAgregarModal}
          onGastoAgregado={handleGastoAgregado}
        />
      )}

      {showEditarModal && gastoSeleccionado && (
        <ModalEditarGasto
          isOpen={showEditarModal}
          onClose={handleCerrarEditarModal}
          onGastoEditado={handleGastoEditado}
          gasto={gastoSeleccionado}
        />
      )}

      {showEliminarModal && gastoSeleccionado && (
        <ModalEliminarGasto
          isOpen={showEliminarModal}
          onClose={handleCerrarEliminarModal}
          onGastoEliminado={handleGastoEliminado}
          gasto={gastoSeleccionado}
        />
      )}
    </div>
  )
}

export default Gastos