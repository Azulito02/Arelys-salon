import { useState, useEffect } from 'react'
import { supabase } from '../database/supabase'
import TablaCreditos from '../components/ventas_credito/TablaCreditos'
import ModalAgregarCredito from '../components/ventas_credito/ModalAgregarCredito'
import ModalEditarCredito from '../components/ventas_credito/ModalEditarCredito'
import ModalEliminarCredito from '../components/ventas_credito/ModalEliminarCredito'
import '../components/ventas_credito/Creditos.css'

const Creditos = () => {
  const [creditos, setCreditos] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Estados para modales
  const [showAgregarModal, setShowAgregarModal] = useState(false)
  const [showEditarModal, setShowEditarModal] = useState(false)
  const [showEliminarModal, setShowEliminarModal] = useState(false)
  const [creditoSeleccionado, setCreditoSeleccionado] = useState(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      
      // Cargar productos
      const { data: productosData, error: errorProductos } = await supabase
        .from('productos')
        .select('*')
        .order('nombre')
      
      if (errorProductos) throw errorProductos
      setProductos(productosData || [])
      
      // Cargar ventas a crédito con productos
      const { data: creditosData, error: errorCreditos } = await supabase
        .from('ventas_credito')
        .select(`
          *,
          productos (*)
        `)
        .order('fecha', { ascending: false })
      
      if (errorCreditos) throw errorCreditos
      setCreditos(creditosData || [])
      
    } catch (error) {
      console.error('Error cargando créditos:', error)
      alert('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  // Funciones para abrir modales
  const handleAgregarCredito = () => {
    setShowAgregarModal(true)
  }

  const handleEditarCredito = (credito) => {
    setCreditoSeleccionado(credito)
    setShowEditarModal(true)
  }

  const handleEliminarCredito = (credito) => {
    setCreditoSeleccionado(credito)
    setShowEliminarModal(true)
  }

  // Funciones para cerrar modales
  const handleCerrarAgregarModal = () => {
    setShowAgregarModal(false)
  }

  const handleCerrarEditarModal = () => {
    setCreditoSeleccionado(null)
    setShowEditarModal(false)
  }

  const handleCerrarEliminarModal = () => {
    setCreditoSeleccionado(null)
    setShowEliminarModal(false)
  }

  // Callbacks para actualizar datos después de operaciones
  const handleCreditoAgregado = () => {
    cargarDatos()
    setShowAgregarModal(false)
  }

  const handleCreditoEditado = () => {
    cargarDatos()
    setShowEditarModal(false)
  }

  const handleCreditoEliminado = () => {
    cargarDatos()
    setShowEliminarModal(false)
  }

  // Función para determinar estado del crédito
  const getEstadoCredito = (fechaFin) => {
    const hoy = new Date()
    const fin = new Date(fechaFin)
    
    if (hoy > fin) {
      return { texto: 'Vencido', clase: 'estado-vencido' }
    } else if ((fin - hoy) / (1000 * 60 * 60 * 24) <= 3) {
      return { texto: 'Por vencer', clase: 'estado-por-vencer' }
    } else {
      return { texto: 'Activo', clase: 'estado-activo' }
    }
  }

  // Calcular resumen
  const calcularResumen = () => {
    const totalCreditos = creditos.length
    const totalMonto = creditos.reduce((sum, credito) => sum + parseFloat(credito.total), 0)
    const creditosVencidos = creditos.filter(credito => {
      const hoy = new Date()
      const fin = new Date(credito.fecha_fin)
      return hoy > fin
    }).length

    return {
      totalCreditos,
      totalMonto,
      creditosVencidos
    }
  }

  const resumen = calcularResumen()

  return (
    <div className="creditos-container">
      {/* Encabezado */}
      <div className="creditos-header">
        <div>
          <h1 className="creditos-titulo">Ventas a Crédito</h1>
          <p className="creditos-subtitulo">Registro y seguimiento de créditos</p>
        </div>
        <button
          onClick={handleAgregarCredito}
          className="btn-agregar-credito"
        >
          <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Crédito
        </button>
      </div>

      {/* Tarjetas de resumen */}
      <div className="resumen-creditos-grid">
        <div className="resumen-card credito-card">
          <div className="resumen-card-content">
            <span className="resumen-card-label">Total Créditos</span>
            <strong className="resumen-card-value">{resumen.totalCreditos}</strong>
          </div>
          <div className="resumen-card-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
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
        
        <div className="resumen-card vencidos-card">
          <div className="resumen-card-content">
            <span className="resumen-card-label">Créditos Vencidos</span>
            <strong className="resumen-card-value">{resumen.creditosVencidos}</strong>
          </div>
          <div className="resumen-card-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Tabla de créditos */}
      <TablaCreditos
        creditos={creditos}
        loading={loading}
        onEditar={handleEditarCredito}
        onEliminar={handleEliminarCredito}
        getEstadoCredito={getEstadoCredito}
      />

      {/* Modales */}
      {showAgregarModal && (
        <ModalAgregarCredito
          isOpen={showAgregarModal}
          onClose={handleCerrarAgregarModal}
          onCreditoAgregado={handleCreditoAgregado}
          productos={productos}
        />
      )}

      {showEditarModal && creditoSeleccionado && (
        <ModalEditarCredito
          isOpen={showEditarModal}
          onClose={handleCerrarEditarModal}
          onCreditoEditado={handleCreditoEditado}
          credito={creditoSeleccionado}
          productos={productos}
        />
      )}

      {showEliminarModal && creditoSeleccionado && (
        <ModalEliminarCredito
          isOpen={showEliminarModal}
          onClose={handleCerrarEliminarModal}
          onCreditoEliminado={handleCreditoEliminado}
          credito={creditoSeleccionado}
        />
      )}
    </div>
  )
}

export default Creditos