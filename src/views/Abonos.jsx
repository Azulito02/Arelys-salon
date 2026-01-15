import { useState, useEffect } from 'react'
import { supabase } from '../database/supabase'
import TablaAbonos from '../components/abonos/TablaAbonos'
import ModalAgregarAbono from '../components/abonos/ModalAgregarAbono'
import ModalEditarAbono from '../components/abonos/ModalEditarAbono'
import ModalEliminarAbono from '../components/abonos/ModalEliminarAbono'
import '../components/abonos/Abonos.css'

const Abonos = () => {
  const [abonos, setAbonos] = useState([])
  const [creditos, setCreditos] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Estados para modales
  const [showAgregarModal, setShowAgregarModal] = useState(false)
  const [showEditarModal, setShowEditarModal] = useState(false)
  const [showEliminarModal, setShowEliminarModal] = useState(false)
  const [abonoSeleccionado, setAbonoSeleccionado] = useState(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      
      // Cargar créditos activos
      const { data: creditosData, error: errorCreditos } = await supabase
        .from('ventas_credito')
        .select('*, productos(*)')
        .order('fecha', { ascending: false })
      
      if (errorCreditos) throw errorCreditos
      setCreditos(creditosData || [])
      
      // Cargar abonos con información de créditos
      const { data: abonosData, error: errorAbonos } = await supabase
        .from('abonos_credito')
        .select(`
          *,
          ventas_credito (
            nombre_cliente,
            productos (*)
          )
        `)
        .order('fecha', { ascending: false })
      
      if (errorAbonos) throw errorAbonos
      setAbonos(abonosData || [])
      
    } catch (error) {
      console.error('Error cargando abonos:', error)
      alert('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  // Funciones para abrir modales
  const handleAgregarAbono = () => {
    setShowAgregarModal(true)
  }

  const handleEditarAbono = (abono) => {
    setAbonoSeleccionado(abono)
    setShowEditarModal(true)
  }

  const handleEliminarAbono = (abono) => {
    setAbonoSeleccionado(abono)
    setShowEliminarModal(true)
  }

  // Funciones para cerrar modales
  const handleCerrarAgregarModal = () => {
    setShowAgregarModal(false)
  }

  const handleCerrarEditarModal = () => {
    setAbonoSeleccionado(null)
    setShowEditarModal(false)
  }

  const handleCerrarEliminarModal = () => {
    setAbonoSeleccionado(null)
    setShowEliminarModal(false)
  }

  // Callbacks para actualizar datos después de operaciones
  const handleAbonoAgregado = () => {
    cargarDatos()
    setShowAgregarModal(false)
  }

  const handleAbonoEditado = () => {
    cargarDatos()
    setShowEditarModal(false)
  }

  const handleAbonoEliminado = () => {
    cargarDatos()
    setShowEliminarModal(false)
  }

  // Calcular resumen
  const calcularResumen = () => {
    const totalAbonos = abonos.length
    const totalMonto = abonos.reduce((sum, abono) => sum + parseFloat(abono.monto), 0)
    
    // Agrupar por método de pago
    const porMetodo = {
      efectivo: abonos.filter(a => a.metodo_pago === 'efectivo').reduce((sum, a) => sum + parseFloat(a.monto), 0),
      tarjeta: abonos.filter(a => a.metodo_pago === 'tarjeta').reduce((sum, a) => sum + parseFloat(a.monto), 0),
      transferencia: abonos.filter(a => a.metodo_pago === 'transferencia').reduce((sum, a) => sum + parseFloat(a.monto), 0)
    }

    return {
      totalAbonos,
      totalMonto,
      porMetodo
    }
  }

  const resumen = calcularResumen()

  // Función para obtener color según método de pago
  const getMetodoPagoColor = (metodo) => {
    switch (metodo) {
      case 'efectivo': return 'metodo-efectivo'
      case 'tarjeta': return 'metodo-tarjeta'
      case 'transferencia': return 'metodo-transferencia'
      default: return 'metodo-default'
    }
  }

  // Función para obtener icono según método de pago
  const getMetodoPagoIcon = (metodo) => {
    switch (metodo) {
      case 'efectivo': return '💰'
      case 'tarjeta': return '💳'
      case 'transferencia': return '🏦'
      default: return '❓'
    }
  }

  return (
    <div className="abonos-container">
      {/* Encabezado */}
      <div className="abonos-header">
        <div>
          <h1 className="abonos-titulo">Abonos a Créditos</h1>
          <p className="abonos-subtitulo">Registro de abonos a ventas a crédito</p>
        </div>
        <button
          onClick={handleAgregarAbono}
          className="btn-agregar-abono"
        >
          <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Abono
        </button>
      </div>

      {/* Tarjetas de resumen */}
      <div className="resumen-abonos-grid">
        <div className="resumen-card abono-card">
          <div className="resumen-card-content">
            <span className="resumen-card-label">Total Abonos</span>
            <strong className="resumen-card-value">{resumen.totalAbonos}</strong>
          </div>
          <div className="resumen-card-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <div className="resumen-card monto-card">
          <div className="resumen-card-content">
            <span className="resumen-card-label">Monto Total</span>
            <strong className="resumen-card-value">
              ${resumen.totalMonto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="resumen-card-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <div className="resumen-card efectivo-card">
          <div className="resumen-card-content">
            <span className="resumen-card-label">En Efectivo</span>
            <strong className="resumen-card-value">
              ${resumen.porMetodo.efectivo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="resumen-card-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Tabla de abonos */}
      <TablaAbonos
        abonos={abonos}
        loading={loading}
        onEditar={handleEditarAbono}
        onEliminar={handleEliminarAbono}
        getMetodoPagoColor={getMetodoPagoColor}
        getMetodoPagoIcon={getMetodoPagoIcon}
      />

      {/* Modales */}
      {showAgregarModal && (
        <ModalAgregarAbono
          isOpen={showAgregarModal}
          onClose={handleCerrarAgregarModal}
          onAbonoAgregado={handleAbonoAgregado}
          creditos={creditos}
        />
      )}

      {showEditarModal && abonoSeleccionado && (
        <ModalEditarAbono
          isOpen={showEditarModal}
          onClose={handleCerrarEditarModal}
          onAbonoEditado={handleAbonoEditado}
          abono={abonoSeleccionado}
          creditos={creditos}
        />
      )}

      {showEliminarModal && abonoSeleccionado && (
        <ModalEliminarAbono
          isOpen={showEliminarModal}
          onClose={handleCerrarEliminarModal}
          onAbonoEliminado={handleAbonoEliminado}
          abono={abonoSeleccionado}
        />
      )}
    </div>
  )
}

export default Abonos