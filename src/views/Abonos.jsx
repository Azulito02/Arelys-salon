import { useState, useEffect } from 'react'
import { supabase } from '../database/supabase'
import TablaAbonos from '../components/abonos/TablaAbonos'
import ModalAgregarAbono from '../components/abonos/ModalAgregarAbono'
import ModalEditarAbono from '../components/abonos/ModalEditarAbono'
import ModalEliminarAbono from '../components/abonos/ModalEliminarAbono'
import '../components/abonos/Abonos.css'

const Abonos = () => {
  const [abonos, setAbonos] = useState([])
  const [abonosFiltrados, setAbonosFiltrados] = useState([])
  const [creditos, setCreditos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroMostrar, setFiltroMostrar] = useState('activos') // 'todos', 'activos', 'completados'
  
  // Estados para modales
  const [showAgregarModal, setShowAgregarModal] = useState(false)
  const [showEditarModal, setShowEditarModal] = useState(false)
  const [showEliminarModal, setShowEliminarModal] = useState(false)
  const [abonoSeleccionado, setAbonoSeleccionado] = useState(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  // Aplicar filtro cuando cambien los abonos o el filtro seleccionado
  useEffect(() => {
    if (abonos.length > 0) {
      aplicarFiltro()
    }
  }, [abonos, filtroMostrar])

  const aplicarFiltro = () => {
    let abonosFiltrados = []
    
    switch (filtroMostrar) {
      case 'activos':
        // Mostrar solo abonos de créditos que aún tengan saldo pendiente
        abonosFiltrados = abonos.filter(abono => {
          const credito = creditos.find(c => c.id === abono.venta_credito_id)
          return credito?.saldo_pendiente > 0
        })
        break
      case 'completados':
        // Mostrar solo abonos de créditos ya pagados (saldo = 0)
        abonosFiltrados = abonos.filter(abono => {
          const credito = creditos.find(c => c.id === abono.venta_credito_id)
          return credito?.saldo_pendiente === 0
        })
        break
      case 'todos':
      default:
        abonosFiltrados = [...abonos]
        break
    }
    
    setAbonosFiltrados(abonosFiltrados)
  }

  const cargarDatos = async () => {
    try {
      setLoading(true)
      
      // Cargar créditos activos CON ABONOS Y SALDO
      const { data: creditosData, error: errorCreditos } = await supabase
        .from('ventas_credito')
        .select(`
          *,
          productos(*),
          abonos_credito(*)
        `)
        .order('fecha', { ascending: false })
      
      if (errorCreditos) throw errorCreditos
      
      // Procesar créditos para calcular saldo si no viene de la DB
      const creditosProcesados = (creditosData || []).map(credito => {
        const total = parseFloat(credito.total) || 0
        
        // Calcular total abonado
        const totalAbonado = credito.abonos_credito?.reduce((sum, abono) => 
          sum + parseFloat(abono.monto || 0), 0) || 0
        
        // Calcular saldo pendiente
        let saldo_pendiente
        if (credito.saldo_pendiente !== null && credito.saldo_pendiente !== undefined) {
          saldo_pendiente = parseFloat(credito.saldo_pendiente)
        } else {
          saldo_pendiente = total - totalAbonado
        }
        
        saldo_pendiente = Math.max(0, saldo_pendiente)
        
        return {
          ...credito,
          total,
          saldo_pendiente,
          total_abonado: totalAbonado,
          completado: saldo_pendiente === 0
        }
      })
      
      setCreditos(creditosProcesados)
      
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
    // Filtrar solo créditos que aún tengan saldo pendiente
    const creditosConSaldo = creditos.filter(credito => credito.saldo_pendiente > 0)
    
    if (creditosConSaldo.length === 0) {
      alert('No hay créditos pendientes disponibles para agregar abonos')
      return
    }
    
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

  // Calcular resumen mejorado
  const calcularResumen = () => {
    const totalAbonos = abonos.length
    
    // Filtrar abonos activos (de créditos con saldo pendiente)
    const abonosActivos = abonos.filter(abono => {
      const credito = creditos.find(c => c.id === abono.venta_credito_id)
      return credito?.saldo_pendiente > 0
    })
    
    const abonosCompletados = abonos.filter(abono => {
      const credito = creditos.find(c => c.id === abono.venta_credito_id)
      return credito?.saldo_pendiente === 0
    })
    
    const totalMonto = abonos.reduce((sum, abono) => sum + parseFloat(abono.monto), 0)
    const montoActivos = abonosActivos.reduce((sum, abono) => sum + parseFloat(abono.monto), 0)
    const montoCompletados = abonosCompletados.reduce((sum, abono) => sum + parseFloat(abono.monto), 0)
    
    // Agrupar por método de pago
    const porMetodo = {
      efectivo: abonos.filter(a => a.metodo_pago === 'efectivo').reduce((sum, a) => sum + parseFloat(a.monto), 0),
      tarjeta: abonos.filter(a => a.metodo_pago === 'tarjeta').reduce((sum, a) => sum + parseFloat(a.monto), 0),
      transferencia: abonos.filter(a => a.metodo_pago === 'transferencia').reduce((sum, a) => sum + parseFloat(a.monto), 0)
    }

    return {
      totalAbonos,
      abonosActivos: abonosActivos.length,
      abonosCompletados: abonosCompletados.length,
      totalMonto,
      montoActivos,
      montoCompletados,
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

  // Función para cambiar el filtro
  const handleCambiarFiltro = (nuevoFiltro) => {
    setFiltroMostrar(nuevoFiltro)
  }

  // Función para archivar abonos de créditos completados
  const handleArchivarCompletados = async () => {
    const abonosAArchivar = abonos.filter(abono => {
      const credito = creditos.find(c => c.id === abono.venta_credito_id)
      return credito?.saldo_pendiente === 0
    })
    
    if (abonosAArchivar.length === 0) {
      alert('No hay abonos de créditos completados para archivar')
      return
    }
    
    const confirmar = window.confirm(
      `¿Estás seguro de archivar ${abonosAArchivar.length} abonos de créditos ya pagados?\n` +
      `Estos abonos serán movidos al archivo histórico.`
    )
    
    if (!confirmar) return
    
    try {
      // Aquí puedes implementar la lógica para archivar en una tabla de historial
      // Por ahora solo eliminaremos los abonos de créditos ya eliminados
      // (suponiendo que ya eliminaste los créditos completados)
      
      alert(`${abonosAArchivar.length} abonos de créditos completados listos para archivar`)
      cargarDatos()
    } catch (error) {
      console.error('Error archivando abonos:', error)
      alert('Error al archivar abonos')
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
          disabled={creditos.filter(c => c.saldo_pendiente > 0).length === 0}
        >
          <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Abono
        </button>
      </div>

      {/* Controles de filtro */}
      <div className="filtros-abonos">
        <div className="filtros-botones">
          <button
            className={`filtro-btn ${filtroMostrar === 'activos' ? 'active' : ''}`}
            onClick={() => handleCambiarFiltro('activos')}
          >
            Activos ({resumen.abonosActivos})
          </button>
          <button
            className={`filtro-btn ${filtroMostrar === 'completados' ? 'active' : ''}`}
            onClick={() => handleCambiarFiltro('completados')}
          >
            Completados ({resumen.abonosCompletados})
          </button>
          <button
            className={`filtro-btn ${filtroMostrar === 'todos' ? 'active' : ''}`}
            onClick={() => handleCambiarFiltro('todos')}
          >
            Todos ({resumen.totalAbonos})
          </button>
        </div>
        
        {resumen.abonosCompletados > 0 && (
          <button
            onClick={handleArchivarCompletados}
            className="btn-archivar-completados"
            title="Archivar abonos de créditos completados"
          >
            <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            Archivar Completados
          </button>
        )}
      </div>

      {/* Tarjetas de resumen MEJORADO */}
      <div className="resumen-abonos-grid">
        <div className="resumen-card abono-card">
          <div className="resumen-card-content">
            <span className="resumen-card-label">Total Abonos</span>
            <strong className="resumen-card-value">{resumen.totalAbonos}</strong>
            <div className="resumen-card-sub">
              <span className="resumen-sub-activos">{resumen.abonosActivos} activos</span>
              <span className="resumen-sub-completados">{resumen.abonosCompletados} completados</span>
            </div>
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
            <div className="resumen-card-sub">
              <span>${resumen.montoActivos.toLocaleString('es-MX', { minimumFractionDigits: 2 })} activos</span>
              <span>${resumen.montoCompletados.toLocaleString('es-MX', { minimumFractionDigits: 2 })} completados</span>
            </div>
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
        abonos={abonosFiltrados}
        loading={loading}
        onEditar={handleEditarAbono}
        onEliminar={handleEliminarAbono}
        getMetodoPagoColor={getMetodoPagoColor}
        getMetodoPagoIcon={getMetodoPagoIcon}
        creditos={creditos} // Pasar créditos para mostrar estado
      />

      {/* Modales */}
      {showAgregarModal && (
        <ModalAgregarAbono
          isOpen={showAgregarModal}
          onClose={handleCerrarAgregarModal}
          onAbonoAgregado={handleAbonoAgregado}
          creditos={creditos.filter(c => c.saldo_pendiente > 0)} // Solo créditos con saldo
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