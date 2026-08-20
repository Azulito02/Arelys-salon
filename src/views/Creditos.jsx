import { useState, useEffect } from 'react'
import { supabase } from '../database/supabase'
import TablaCreditos from '../components/ventas_credito/TablaCreditos'
import ModalAgregarCredito from '../components/ventas_credito/ModalAgregarCredito'
import ModalEditarCredito from '../components/ventas_credito/ModalEditarCredito'
import ModalEliminarCredito from '../components/ventas_credito/ModalEliminarCredito'
import '../components/ventas_credito/Creditos.css'

const Creditos = () => {
  const [creditos, setCreditos] = useState([])
  const [creditosFiltrados, setCreditosFiltrados] = useState([])
  const [productos, setProductos] = useState([])
  const [servicios, setServicios] = useState([]) // ✅ NUEVO: servicios
  const [itemsDisponibles, setItemsDisponibles] = useState([])
  const [loading, setLoading] = useState(true)
  const [archivando, setArchivando] = useState(false)
  const [filtroMostrar, setFiltroMostrar] = useState('pendientes')
  
  // Estados para modales
  const [showAgregarModal, setShowAgregarModal] = useState(false)
  const [showEditarModal, setShowEditarModal] = useState(false)
  const [showEliminarModal, setShowEliminarModal] = useState(false)
  const [creditoSeleccionado, setCreditoSeleccionado] = useState(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  // Aplicar filtro cuando cambien los créditos o el filtro seleccionado
  useEffect(() => {
    if (creditos.length > 0) {
      aplicarFiltro()
    }
  }, [creditos, filtroMostrar])

  const aplicarFiltro = () => {
    let creditosFiltrados = []
    
    switch (filtroMostrar) {
      case 'pendientes':
        creditosFiltrados = creditos.filter(credito => 
          credito.saldo_pendiente > 0
        )
        break
      case 'completados':
        creditosFiltrados = creditos.filter(credito => 
          credito.saldo_pendiente === 0
        )
        break
      case 'todos':
      default:
        creditosFiltrados = [...creditos]
        break
    }
    
    setCreditosFiltrados(creditosFiltrados)
  }

 const cargarDatos = async () => {
  try {
    setLoading(true)
    
    // Cargar TODOS los productos por lotes (evita el límite de 1000 filas de Supabase)
    let productosData = []
    let desde = 0
    const tamanoLote = 1000
    let sigueHabiendoDatos = true

    while (sigueHabiendoDatos) {
      const { data: lote, error: errorProductos } = await supabase
        .from('productos')
        .select('*')
        .order('nombre')
        .range(desde, desde + tamanoLote - 1)

      if (errorProductos) throw errorProductos

      if (lote && lote.length > 0) {
        productosData = [...productosData, ...lote]
        desde += tamanoLote
        sigueHabiendoDatos = lote.length === tamanoLote
      } else {
        sigueHabiendoDatos = false
      }
    }

    setProductos(productosData || [])
    
    // ✅ NUEVO: Cargar servicios
    const { data: serviciosData, error: errorServicios } = await supabase
      .from('servicios')
      .select('*')
      .order('nombre')
    
    if (errorServicios) throw errorServicios
    setServicios(serviciosData || [])
    
    // ✅ CARGAR CRÉDITOS CON ABONOS
    const { data: creditosData, error: errorCreditos } = await supabase
      .from('ventas_credito')
      .select(`
        *,
        productos (*),
        servicios (*),
        abonos_credito (*)
      `)
      .order('fecha', { ascending: false })
    
    if (errorCreditos) throw errorCreditos
    
    // Procesar créditos con todos sus datos
    const creditosProcesados = (creditosData || []).map(credito => {
      const total = parseFloat(credito.total) || 0
      const precio_unitario = parseFloat(credito.precio_unitario) || 0
      
      let item = null
      if (credito.producto_id) {
        item = productosData?.find(p => p.id === credito.producto_id) || null
      } else if (credito.servicio_id) {
        item = serviciosData?.find(s => s.id === credito.servicio_id) || null
      }
      
      let saldo_pendiente
      if (credito.saldo_pendiente !== null && credito.saldo_pendiente !== undefined) {
        saldo_pendiente = parseFloat(credito.saldo_pendiente)
      } else {
        const totalAbonado = credito.abonos_credito?.reduce((sum, abono) => 
          sum + parseFloat(abono.monto || 0), 0) || 0
        saldo_pendiente = total - totalAbonado
      }
      
      saldo_pendiente = Math.max(0, saldo_pendiente)
      const total_abonado = total - saldo_pendiente
      
      return {
        ...credito,
        item,
        tipo_item: credito.producto_id ? 'producto' : credito.servicio_id ? 'servicio' : null,
        total,
        precio_unitario,
        saldo_pendiente,
        total_abonado,
        completado: saldo_pendiente === 0,
        abonos_credito: credito.abonos_credito || []
      }
    })
    
    console.log('✅ Créditos cargados con abonos:', creditosProcesados)
    setCreditos(creditosProcesados)
    
    // Combinar items para búsquedas
    const combinados = [
      ...(productosData || []).map(p => ({ ...p, tipo: 'producto' })),
      ...(serviciosData || []).map(s => ({ ...s, tipo: 'servicio' }))
    ]
    setItemsDisponibles(combinados)
    
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

  // 🖨️ FUNCIÓN PARA GENERAR TICKET DE CRÉDITO - CON SERVICIOS
  const generarContenidoTicketCredito = (credito) => {
    try {
      const centrar = (texto) => {
        const ancho = 32
        const espacios = Math.max(0, Math.floor((ancho - texto.length) / 2))
        return " ".repeat(espacios) + texto
      }

      const linea = () => "--------------------------------"

      const formatFecha = (fechaISO) => {
        if (!fechaISO) return ''
        try {
          const fechaUTC = new Date(fechaISO)
          const fechaNic = new Date(fechaUTC.getTime() - (6 * 60 * 60 * 1000))
          const d = fechaNic.getDate().toString().padStart(2, '0')
          const m = (fechaNic.getMonth() + 1).toString().padStart(2, '0')
          const y = fechaNic.getFullYear()
          return `${d}/${m}/${y}`
        } catch (e) {
          return fechaISO
        }
      }

      if (!credito) {
        console.error('❌ Crédito no válido')
        return 'Error: Crédito no válido'
      }

      // Obtener todos los créditos del mismo cliente
      const creditosDelCliente = creditos.filter(c => 
        c.nombre_cliente?.toLowerCase().trim() === credito.nombre_cliente?.toLowerCase().trim()
      )

      const cliente = credito.nombre_cliente || 'Cliente'

      // Calcular totales generales del cliente
      let totalGeneralCliente = 0
      let saldoGeneralCliente = 0
      let totalAbonadoCliente = 0

      creditosDelCliente.forEach(c => {
        totalGeneralCliente += parseFloat(c.total || 0)
        saldoGeneralCliente += parseFloat(c.saldo_pendiente || 0)
        
        const abonos = c.abonos_credito || []
        totalAbonadoCliente += abonos.reduce((sum, a) => sum + parseFloat(a.monto || 0), 0)
      })

      let contenido = `
${centrar("ARELYS SALON")}
${centrar("8354-3180")}
${linea()}
     ESTADO DE CUENTA
${linea()}
CLIENTE:
${cliente}
${linea()}
FECHA:
${formatFecha(new Date().toISOString())}
${linea()}
RESUMEN DE CRÉDITOS:
Total de créditos: ${creditosDelCliente.length}
Monto total:       C$${totalGeneralCliente.toFixed(2)}
Total abonado:     C$${totalAbonadoCliente.toFixed(2)}
${linea()}
SALDO PENDIENTE:   C$${saldoGeneralCliente.toFixed(2)}
${linea()}
${centrar("GRACIAS POR SU PAGO")}
${centrar("Conserve este comprobante")}

\n\n\n\n`

      return contenido
    } catch (error) {
      console.error('❌ Error generando ticket:', error)
      return 'Error al generar el ticket'
    }
  }

  // 🖨️ FUNCIÓN PARA IMPRIMIR TICKET DE CRÉDITO
  const imprimirTicketCredito = (credito) => {
    console.log('🖨️ Imprimiendo estado de cuenta para cliente:', credito?.nombre_cliente)
    
    try {
      const contenido = generarContenidoTicketCredito(credito)
      const encoded = encodeURIComponent(contenido)
      
      if (navigator.userAgent.includes('Android')) {
        window.location.href = `rawbt:${encoded}`
      } else {
        const ventana = window.open('', '_blank')
        ventana.document.write(`<pre>${contenido}</pre>`)
        ventana.document.close()
        ventana.print()
      }
      
    } catch (error) {
      console.error('❌ Error al imprimir:', error)
      alert('Error al imprimir estado de cuenta')
    }
  }

  // Función para determinar estado del crédito
  const getEstadoCredito = (credito) => {
    if (credito.saldo_pendiente === 0) {
      return { texto: 'Completado', clase: 'estado-completado' }
    }
    
    if (!credito.fecha_fin) {
      return { texto: 'Sin fecha', clase: 'estado-sin-fecha' }
    }
    
    const hoy = new Date()
    const fin = new Date(credito.fecha_fin)
    const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
    const finSinHora = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate())
    const diferenciaMs = finSinHora.getTime() - hoySinHora.getTime()
    const diferenciaDias = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24))
    
    if (diferenciaDias < 0) {
      return { texto: 'Vencido', clase: 'estado-vencido' }
    } else if (diferenciaDias === 0) {
      return { texto: 'Vence hoy', clase: 'estado-por-vencer' }
    } else if (diferenciaDias <= 3) {
      return { texto: `Por vencer (${diferenciaDias}d)`, clase: 'estado-por-vencer' }
    } else {
      return { texto: 'Activo', clase: 'estado-activo' }
    }
  }

  // Calcular resumen
  const calcularResumen = () => {
    const totalCreditos = creditos.length
    const totalMonto = creditos.reduce((sum, credito) => sum + credito.total, 0)
    
    const creditosPendientes = creditos.filter(credito => credito.saldo_pendiente > 0).length
    const creditosCompletados = creditos.filter(credito => credito.saldo_pendiente === 0).length
    
    const totalSaldoPendiente = creditos.reduce((sum, credito) => 
      sum + (credito.saldo_pendiente || 0), 0)
    
    return {
      totalCreditos,
      totalMonto,
      creditosPendientes,
      creditosCompletados,
      totalSaldoPendiente
    }
  }

  const resumen = calcularResumen()

  // Función para cambiar el filtro
  const handleCambiarFiltro = (nuevoFiltro) => {
    setFiltroMostrar(nuevoFiltro)
  }

  // Función para eliminar créditos completados
  const handleArchivarCompletados = async () => {
    const creditosCompletados = creditos.filter(c => c.saldo_pendiente === 0)
    
    if (creditosCompletados.length === 0) {
      alert('No hay créditos completados para eliminar')
      return
    }
    
    const listaClientes = creditosCompletados
      .map(c => `• ${c.nombre_cliente} - C$${c.total.toFixed(2)}`)
      .join('\n')
    
    const confirmar = window.confirm(
      `¿ELIMINAR ${creditosCompletados.length} CRÉDITOS COMPLETADOS?\n\n` +
      `Clientes:\n${listaClientes}\n\n` +
      `⚠️ Esta acción es IRREVERSIBLE. ¿Continuar?`
    )
    
    if (!confirmar) return
    
    try {
      setArchivando(true)
      
      const idsCompletados = creditosCompletados.map(c => c.id)
      
      if (idsCompletados.length > 0) {
        const { error: errorEliminar } = await supabase
          .from('ventas_credito')
          .delete()
          .in('id', idsCompletados)
        
        if (errorEliminar) throw errorEliminar
      }
      
      alert(`✅ ${creditosCompletados.length} créditos completados eliminados`)
      cargarDatos()
      
    } catch (error) {
      console.error('Error eliminando créditos:', error)
      alert(`Error al eliminar créditos: ${error.message || 'Error desconocido'}`)
    } finally {
      setArchivando(false)
    }
  }

  return (
    <div className="creditos-container">
      {/* Header responsive */}
      <div className="creditos-header">
        <div className="creditos-titulo-container">
          <h1 className="creditos-titulo">Ventas a Crédito</h1>
          <p className="creditos-subtitulo">Registro y seguimiento de créditos</p>
        </div>
        
        <div className="creditos-botones-header">
          <button
            onClick={handleAgregarCredito}
            className="btn-agregar-credito"
            disabled={loading || archivando}
          >
            <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Crédito
          </button>
        </div>
      </div>

      {/* Controles de filtro responsive */}
      <div className="filtros-creditos">
        <div className="filtros-botones">
          <button
            className={`filtro-btn ${filtroMostrar === 'pendientes' ? 'active' : ''}`}
            onClick={() => handleCambiarFiltro('pendientes')}
            disabled={loading || archivando}
          >
            <span className="filtro-btn-text">
              Pendientes <span className="filtro-btn-badge">{resumen.creditosPendientes}</span>
            </span>
          </button>
          <button
            className={`filtro-btn ${filtroMostrar === 'completados' ? 'active' : ''}`}
            onClick={() => handleCambiarFiltro('completados')}
            disabled={loading || archivando}
          >
            <span className="filtro-btn-text">
              Completados <span className="filtro-btn-badge">{resumen.creditosCompletados}</span>
            </span>
          </button>
          <button
            className={`filtro-btn ${filtroMostrar === 'todos' ? 'active' : ''}`}
            onClick={() => handleCambiarFiltro('todos')}
            disabled={loading || archivando}
          >
            <span className="filtro-btn-text">
              Todos <span className="filtro-btn-badge">{resumen.totalCreditos}</span>
            </span>
          </button>
        </div>
        
        {resumen.creditosCompletados > 0 && (
          <button
            onClick={handleArchivarCompletados}
            className="btn-archivar-completados"
            title="Eliminar créditos completados"
            disabled={loading || archivando}
          >
            {archivando ? (
              <>
                <div className="spinner-small"></div>
                Eliminando...
              </>
            ) : (
              <>
                <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <span className="btn-archivar-text">
                  Eliminar Completados <span className="btn-archivar-badge">{resumen.creditosCompletados}</span>
                </span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Tarjetas de resumen responsive */}
      <div className="resumen-creditos-grid">
        <div className="resumen-card credito-card">
          <div className="resumen-card-content">
            <span className="resumen-card-label">TOTALES CRÉDITOS</span>
            <strong className="resumen-card-value">{resumen.totalCreditos}</strong>
            <div className="resumen-card-sub">
              <span className="resumen-sub-pendientes">{resumen.creditosPendientes} pendientes</span>
              <span className="resumen-sub-completados">{resumen.creditosCompletados} completados</span>
            </div>
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
            <span className="resumen-card-label">MONTO TOTAL</span>
            <strong className="resumen-card-value">
              C${resumen.totalMonto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="resumen-card-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <div className="resumen-card saldo-card">
          <div className="resumen-card-content">
            <span className="resumen-card-label">SALDO PENDIENTE</span>
            <strong className="resumen-card-value saldo-pendiente-total">
              C${resumen.totalSaldoPendiente.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="resumen-card-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Tabla de créditos */}
      <TablaCreditos
        creditos={creditosFiltrados}
        loading={loading}
        onEditar={handleEditarCredito}
        onEliminar={handleEliminarCredito}
        onImprimir={imprimirTicketCredito}
        getEstadoCredito={getEstadoCredito}
      />

      {/* Modales */}
      {showAgregarModal && (
        <ModalAgregarCredito
          isOpen={showAgregarModal}
          onClose={handleCerrarAgregarModal}
          onCreditoAgregado={handleCreditoAgregado}
          productos={productos}
          servicios={servicios}  // ✅ NUEVO
          itemsDisponibles={itemsDisponibles}
        />
      )}

      {showEditarModal && creditoSeleccionado && (
        <ModalEditarCredito
          isOpen={showEditarModal}
          onClose={handleCerrarEditarModal}
          onCreditoEditado={handleCreditoEditado}
          credito={creditoSeleccionado}
          productos={productos}
          servicios={servicios}  // ✅ NUEVO
          itemsDisponibles={itemsDisponibles}
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