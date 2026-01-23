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
    
    // Cargar productos
    const { data: productosData, error: errorProductos } = await supabase
      .from('productos')
      .select('*')
      .order('nombre')
    
    if (errorProductos) throw errorProductos
    setProductos(productosData || [])
    
    // Cargar ventas a crédito - SOLO necesitamos datos básicos
    const { data: creditosData, error: errorCreditos } = await supabase
      .from('ventas_credito')
      .select(`
        *,
        productos (*)
      `)
      .order('fecha', { ascending: false })
    
    if (errorCreditos) throw errorCreditos
    
    // Procesar créditos - usar saldo_pendiente DIRECTAMENTE de la DB
    const creditosProcesados = (creditosData || []).map(credito => {
      const total = parseFloat(credito.total) || 0
      const precio_unitario = parseFloat(credito.precio_unitario) || 0
      const saldo_pendiente = parseFloat(credito.saldo_pendiente) || 0
      
      // Calcular total abonado como diferencia
      const total_abonado = Math.max(0, total - saldo_pendiente)
      
      return {
        ...credito,
        total,
        precio_unitario,
        saldo_pendiente, // USAR DIRECTAMENTE de la DB
        total_abonado,
        completado: saldo_pendiente === 0
      }
    })
    
    setCreditos(creditosProcesados)
    
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
  const getEstadoCredito = (credito) => {
    // Si el crédito está completado (saldo = 0), siempre mostrar "Completado"
    if (credito.saldo_pendiente === 0) {
      return { texto: 'Completado', clase: 'estado-completado' }
    }
    
    if (!credito.fecha_fin) {
      return { texto: 'Sin fecha', clase: 'estado-sin-fecha' }
    }
    
    const hoy = new Date()
    const fin = new Date(credito.fecha_fin)
    
    // Ajustar las fechas para comparación sin horas
    const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
    const finSinHora = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate())
    
    // Calcular diferencia en días
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
    
    const creditosVencidos = creditos.filter(credito => {
      if (!credito.fecha_fin || credito.saldo_pendiente === 0) return false
      const hoy = new Date()
      const fin = new Date(credito.fecha_fin)
      const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
      const finSinHora = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate())
      return hoySinHora > finSinHora
    }).length
    
    const totalSaldoPendiente = creditos.reduce((sum, credito) => 
      sum + (credito.saldo_pendiente || 0), 0)
    
    const totalAbonado = creditos.reduce((sum, credito) => 
      sum + (credito.total_abonado || 0), 0)

    return {
      totalCreditos,
      totalMonto,
      creditosPendientes,
      creditosCompletados,
      creditosVencidos,
      totalSaldoPendiente,
      totalAbonado
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
      
      // Intentar usar la tabla de archivo si existe
      try {
        // Primero intentar insertar en tabla de archivo
        const creditosParaArchivar = creditosCompletados.map(({ 
          abonos_credito, 
          productos, 
          total_abonado, 
          completado, 
          ...credito 
        }) => ({
          ...credito,
          saldo_pendiente: 0,
          total_abonado: total_abonado || 0,
          fecha_archivado: new Date().toISOString(),
          usuario_archivo: JSON.parse(localStorage.getItem('usuarioArelyz'))?.nombre || 'Sistema'
        }))
        
        const { error: errorArchivo } = await supabase
          .from('creditos_archivados')
          .insert(creditosParaArchivar)
        
        if (errorArchivo) {
          console.warn('No se pudo archivar, tabla no existe. Eliminando directamente...')
        }
      } catch (archivoError) {
        console.warn('Error en archivo, continuando con eliminación directa:', archivoError)
      }
      
      // Eliminar los créditos completados
      const idsCompletados = creditosCompletados.map(c => c.id)
      
      if (idsCompletados.length > 0) {
        // Usar ROW para eliminación masiva más eficiente
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
      
      if (error.code === 'PGRST205') {
        alert(
          'Error: La tabla creditos_archivados no existe.\n\n' +
          'Ejecuta este SQL en Supabase para crearla:\n\n' +
          'CREATE TABLE creditos_archivados (\n' +
          '  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n' +
          '  producto_id uuid REFERENCES productos(id),\n' +
          '  cantidad integer NOT NULL,\n' +
          '  precio_unitario numeric(10,2) NOT NULL,\n' +
          '  total numeric(10,2) NOT NULL,\n' +
          '  nombre_cliente text NOT NULL,\n' +
          '  fecha_inicio date NOT NULL,\n' +
          '  fecha_fin date NOT NULL,\n' +
          '  fecha timestamp DEFAULT now(),\n' +
          '  saldo_pendiente numeric(10,2) DEFAULT 0,\n' +
          '  total_abonado numeric(10,2) DEFAULT 0,\n' +
          '  fecha_archivado timestamp DEFAULT now(),\n' +
          '  usuario_archivo text DEFAULT \'Sistema\'\n' +
          ');'
        )
      } else {
        alert(`Error al eliminar créditos: ${error.message || 'Error desconocido'}`)
      }
    } finally {
      setArchivando(false)
    }
  }

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
          disabled={loading || archivando}
        >
          <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Crédito
        </button>
      </div>

      {/* Controles de filtro */}
      <div className="filtros-creditos">
        <div className="filtros-botones">
          <button
            className={`filtro-btn ${filtroMostrar === 'pendientes' ? 'active' : ''}`}
            onClick={() => handleCambiarFiltro('pendientes')}
            disabled={loading || archivando}
          >
            Pendientes ({resumen.creditosPendientes})
          </button>
          <button
            className={`filtro-btn ${filtroMostrar === 'completados' ? 'active' : ''}`}
            onClick={() => handleCambiarFiltro('completados')}
            disabled={loading || archivando}
          >
            Completados ({resumen.creditosCompletados})
          </button>
          <button
            className={`filtro-btn ${filtroMostrar === 'todos' ? 'active' : ''}`}
            onClick={() => handleCambiarFiltro('todos')}
            disabled={loading || archivando}
          >
            Todos ({resumen.totalCreditos})
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
                Eliminar Completados ({resumen.creditosCompletados})
              </>
            )}
          </button>
        )}
      </div>

      {/* Tarjetas de resumen */}
      <div className="resumen-creditos-grid">
        <div className="resumen-card credito-card">
          <div className="resumen-card-content">
            <span className="resumen-card-label">Total Créditos</span>
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
        
        <div className="resumen-card saldo-card">
          <div className="resumen-card-content">
            <span className="resumen-card-label">Saldo Pendiente</span>
            <strong className="resumen-card-value saldo-pendiente-total">
              ${resumen.totalSaldoPendiente.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="resumen-card-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
        creditos={creditosFiltrados}
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