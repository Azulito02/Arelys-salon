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
  const [filtroMostrar, setFiltroMostrar] = useState('activos')
  const [archivando, setArchivando] = useState(false)
  
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
        abonosFiltrados = abonos.filter(abono => {
          const credito = creditos.find(c => c.id === abono.venta_credito_id)
          return credito?.saldo_pendiente > 0
        })
        break
      case 'completados':
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
      
      // Cargar créditos
      const { data: creditosData, error: errorCreditos } = await supabase
        .from('ventas_credito')
        .select(`
          *,
          productos(*),
          abonos_credito(*)
        `)
        .order('fecha', { ascending: false })
      
      if (errorCreditos) throw errorCreditos
      
      // Procesar créditos
      const creditosProcesados = (creditosData || []).map(credito => {
        const total = parseFloat(credito.total) || 0
        const totalAbonado = credito.abonos_credito?.reduce((sum, abono) => 
          sum + parseFloat(abono.monto || 0), 0) || 0
        
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
      
      // Cargar abonos
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

  // Calcular resumen
  const calcularResumen = () => {
    const totalAbonos = abonos.length
    
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
      setArchivando(true)
      // Implementar lógica de archivado aquí si es necesario
      alert(`${abonosAArchivar.length} abonos de créditos completados listos para archivar`)
      cargarDatos()
    } catch (error) {
      console.error('Error archivando abonos:', error)
      alert('Error al archivar abonos')
    } finally {
      setArchivando(false)
    }
  }


  const generarContenidoTicketAbono = (abono) => {

  const centrar = (texto) => {
    const ancho = 32
    const espacios = Math.max(0, Math.floor((ancho - texto.length) / 2))
    return " ".repeat(espacios) + texto
  }

  const linea = () => "--------------------------------"

  const formatFecha = (fechaISO) => {
    if (!fechaISO) return ''
    const fechaUTC = new Date(fechaISO)
    const fechaNic = new Date(fechaUTC.getTime() - (6 * 60 * 60 * 1000))

    const d = fechaNic.getDate().toString().padStart(2, '0')
    const m = (fechaNic.getMonth() + 1).toString().padStart(2, '0')
    const y = fechaNic.getFullYear()

    let h = fechaNic.getHours()
    const min = fechaNic.getMinutes().toString().padStart(2, '0')
    const ampm = h >= 12 ? 'p.m.' : 'a.m.'

    h = h % 12
    h = h ? h.toString().padStart(2, '0') : '12'

    return `${d}/${m}/${y} ${h}:${min} ${ampm}`
  }

  const credito = creditos.find(c => c.id === abono.venta_credito_id)

  const cliente = credito?.nombre_cliente || 'Cliente'
  const producto = credito?.productos?.nombre || 'Producto'

  const totalCredito = parseFloat(credito?.total || 0)
  const saldoPendiente = parseFloat(credito?.saldo_pendiente || 0)
  const montoAbono = parseFloat(abono.monto || 0)

  const saldoAnterior = (saldoPendiente + montoAbono).toFixed(2)
  const saldoActual = saldoPendiente.toFixed(2)

  const metodo = abono.metodo_pago?.toUpperCase() || "EFECTIVO"

  return `
${centrar("ARELYS SALON")}
${centrar("8354-3180")}
${linea()}
        TICKET ABONO
${linea()}
CLIENTE:
${cliente}
PRODUCTO:
${producto}
${linea()}
FECHA:
${formatFecha(abono.fecha)}
${linea()}
TOTAL CRED: C$${totalCredito.toFixed(2)}
SALDO ANT:  C$${saldoAnterior}
ABONO:      C$${montoAbono.toFixed(2)}
${linea()}
SALDO ACT:  C$${saldoActual}
${linea()}
METODO: ${metodo}
${linea()}
${centrar("GRACIAS POR SU PAGO")}





\n\n\n\n
`
}


const imprimirTicketAbono = (abono) => {
  try {
    const contenido = generarContenidoTicketAbono(abono)
    const encoded = encodeURIComponent(contenido)
    window.location.href = `rawbt:${encoded}`
  } catch (error) {
    alert("Error al imprimir ticket")
  }
}


  return (
    <div className="abonos-container">
      {/* Header responsive */}
      <div className="abonos-header">
        <div className="abonos-titulo-container">
          <h1 className="abonos-titulo">Abonos a Créditos</h1>
          <p className="abonos-subtitulo">Registro de abonos a ventas a crédito</p>
        </div>
        
        <div className="abonos-botones-header">
          <button
            onClick={handleAgregarAbono}
            className="btn-agregar-abono"
            disabled={loading || creditos.filter(c => c.saldo_pendiente > 0).length === 0 || archivando}
          >
            <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Abono
          </button>
        </div>
      </div>

      {/* Controles de filtro responsive */}
      <div className="filtros-abonos">
        <div className="filtros-botones">
          <button
            className={`filtro-btn ${filtroMostrar === 'activos' ? 'active' : ''}`}
            onClick={() => handleCambiarFiltro('activos')}
            disabled={loading || archivando}
          >
            <span className="filtro-btn-text">
              Activos <span className="filtro-btn-badge">{resumen.abonosActivos}</span>
            </span>
          </button>
          <button
            className={`filtro-btn ${filtroMostrar === 'completados' ? 'active' : ''}`}
            onClick={() => handleCambiarFiltro('completados')}
            disabled={loading || archivando}
          >
            <span className="filtro-btn-text">
              Completados <span className="filtro-btn-badge">{resumen.abonosCompletados}</span>
            </span>
          </button>
          <button
            className={`filtro-btn ${filtroMostrar === 'todos' ? 'active' : ''}`}
            onClick={() => handleCambiarFiltro('todos')}
            disabled={loading || archivando}
          >
            <span className="filtro-btn-text">
              Todos <span className="filtro-btn-badge">{resumen.totalAbonos}</span>
            </span>
          </button>
        </div>
        
        {resumen.abonosCompletados > 0 && (
          <button
            onClick={handleArchivarCompletados}
            className="btn-archivar-completados"
            title="Archivar abonos de créditos completados"
            disabled={loading || archivando}
          >
            {archivando ? (
              <>
                <div className="spinner-small"></div>
                Archivando...
              </>
            ) : (
              <>
                <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <span className="btn-archivar-text">
                  Archivar <span className="btn-archivar-badge">{resumen.abonosCompletados}</span>
                </span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Tarjetas de resumen responsive */}
      <div className="resumen-abonos-grid">
        <div className="resumen-card abono-card">
          <div className="resumen-card-content">
            <span className="resumen-card-label">TOTAL ABONOS</span>
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
            <span className="resumen-card-label">MONTO TOTAL</span>
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
            <span className="resumen-card-label">EN EFECTIVO</span>
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
        creditos={creditos}
        onImprimir={imprimirTicketAbono}
      />


      {/* Modales */}
      {showAgregarModal && (
        <ModalAgregarAbono
          isOpen={showAgregarModal}
          onClose={handleCerrarAgregarModal}
          onAbonoAgregado={handleAbonoAgregado}
          creditos={creditos.filter(c => c.saldo_pendiente > 0)}
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