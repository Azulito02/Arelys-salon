import { useState, useEffect } from 'react'
import { supabase } from '../database/supabase'
import './Arqueos.css'

const Arqueos = () => {
  const [arqueos, setArqueos] = useState([])
  const [loading, setLoading] = useState(true)
  const [calculando, setCalculando] = useState(false) // <-- AGREGADO ESTE ESTADO
  const [modalAbierto, setModalAbierto] = useState(false)
  const [resumenTurno, setResumenTurno] = useState(null)
  const [efectivoContado, setEfectivoContado] = useState('')
  const [ultimoArqueo, setUltimoArqueo] = useState(null)
  
  useEffect(() => {
    cargarArqueos()
  }, [])

  const cargarArqueos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('arqueos')
        .select('*')
        .order('fecha', { ascending: false })
        .limit(20)
      
      if (error) throw error
      setArqueos(data || [])
      
      // Establecer último arqueo
      if (data && data.length > 0) {
        setUltimoArqueo(data[0])
      }
      
    } catch (error) {
      console.error('Error cargando arqueos:', error)
      alert('Error al cargar arqueos')
    } finally {
      setLoading(false)
    }
  }

  const calcularResumenTurno = async () => {
    try {
      setCalculando(true)
      
      // Determinar fecha de inicio (último arqueo o inicio del día)
      let fechaDesde = new Date()
      fechaDesde.setHours(0, 0, 0, 0) // Inicio del día
      
      if (ultimoArqueo) {
        // Si hay arqueo anterior, calcular desde esa fecha
        fechaDesde = new Date(ultimoArqueo.fecha)
      }
      
      const fechaHasta = new Date()
      
      // Cálculo básico en frontend para preview
      const [ventasResp, creditosResp, abonosResp, gastosResp] = await Promise.all([
        supabase.from('ventas').select('*').gte('fecha', fechaDesde.toISOString()),
        supabase.from('ventas_credito').select('*').gte('fecha', fechaDesde.toISOString()),
        supabase.from('abonos_credito').select('*').gte('fecha', fechaDesde.toISOString()),
        supabase.from('gastos').select('*').gte('fecha', fechaDesde.toISOString())
      ])
      
      const ventas = ventasResp.data || []
      const creditos = creditosResp.data || []
      const abonos = abonosResp.data || []
      const gastos = gastosResp.data || []
      
      const totalVentas = ventas.reduce((s, v) => s + (parseFloat(v.total) || 0), 0)
      const totalCreditos = creditos.reduce((s, c) => s + (parseFloat(c.total) || 0), 0)
      
      const abonosEfectivo = abonos
        .filter(a => a.metodo_pago === 'efectivo')
        .reduce((s, a) => s + (parseFloat(a.monto) || 0), 0)
      
      const abonosOtros = abonos
        .filter(a => a.metodo_pago !== 'efectivo')
        .reduce((s, a) => s + (parseFloat(a.monto) || 0), 0)
      
      const totalGastos = gastos.reduce((s, g) => s + (parseFloat(g.monto) || 0), 0)
      
      const resumen = {
        totalVentas,
        totalCreditos,
        abonosEfectivo,
        abonosOtros,
        totalGastos,
        efectivoNeto: totalVentas + abonosEfectivo - totalGastos,
        cantidadVentas: ventas.length,
        cantidadCreditos: creditos.length,
        cantidadAbonosEfectivo: abonos.filter(a => a.metodo_pago === 'efectivo').length,
        cantidadAbonosOtros: abonos.filter(a => a.metodo_pago !== 'efectivo').length,
        cantidadGastos: gastos.length,
        fechaDesde: fechaDesde.toLocaleString('es-MX'),
        fechaHasta: fechaHasta.toLocaleString('es-MX'),
        // Agregar campos para mostrar en el modal
        totalVentasEfectivo: totalVentas,
        totalAbonosEfectivo: abonosEfectivo,
        totalAbonosOtros: abonosOtros,
        totalEfectivo: totalVentas + abonosEfectivo,
        totalVentasGeneral: totalVentas + totalCreditos
      }
      
      setResumenTurno(resumen)
      setEfectivoContado((totalVentas + abonosEfectivo - totalGastos).toFixed(2))
      setModalAbierto(true)
      
    } catch (error) {
      console.error('Error calculando resumen:', error)
      alert('Error al calcular resumen del turno')
    } finally {
      setCalculando(false)
    }
  }

  const abrirModal = async () => {
    await calcularResumenTurno()
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setResumenTurno(null)
    setEfectivoContado('')
  }

  const realizarArqueo = async () => {
    if (!efectivoContado || parseFloat(efectivoContado) < 0) {
      alert('Ingresa un monto válido para el efectivo contado')
      return
    }
    
    const usuario = JSON.parse(localStorage.getItem('usuarioArelyz'))?.nombre || 'Sistema'
    const efectivo = parseFloat(efectivoContado)
    
    const confirmar = window.confirm(
      `¿CONFIRMAR ARQUEO DE TURNO?\n\n` +
      `Efectivo contado: C$${efectivo.toFixed(2)}\n\n` +
      `Esta acción es IRREVERSIBLE. ¿Continuar?`
    )
    
    if (!confirmar) return
    
    try {
      setLoading(true)
      
      // Llamar a la función SQL en el backend
      const { data, error } = await supabase.rpc('realizar_arqueo_caja', {
        p_efectivo_contado: efectivo,
        p_usuario_nombre: usuario
      })
      
      if (error) throw error
      
      if (!data.success) {
        throw new Error(data.error || 'Error en el arqueo')
      }
      
      // Mostrar resultado
      const diferencia = data.diferencia || 0
      const resumen = data.resumen || {}
      
      alert(
        `✅ ARQUEO COMPLETADO\n\n` +
        `📊 Resumen:\n` +
        `• Ventas en efectivo: C$${(resumen.total_ventas_efectivo || 0).toFixed(2)}\n` +
        `• Abonos en efectivo: C$${(resumen.total_abonos_efectivo || 0).toFixed(2)}\n` +
        `• Gastos: C$${(resumen.total_gastos || 0).toFixed(2)}\n` +
        `• Efectivo neto esperado: C$${(resumen.efectivo_neto || 0).toFixed(2)}\n` +
        `• Efectivo contado: C$${efectivo.toFixed(2)}\n` +
        (diferencia !== 0 ? `• Diferencia: C$${Math.abs(diferencia).toFixed(2)} ${diferencia > 0 ? '(Sobrante)' : '(Faltante)'}\n` : '') +
        `\n🗑️ Registros procesados:\n` +
        `• ${resumen.cantidad_ventas || 0} ventas\n` +
        `• ${resumen.cantidad_abonos_efectivo || 0} abonos en efectivo\n` +
        `• ${resumen.cantidad_gastos || 0} gastos`
      )
      
      setModalAbierto(false)
      setResumenTurno(null)
      setEfectivoContado('')
      cargarArqueos()
      
    } catch (error) {
      console.error('Error en arqueo:', error)
      
      // Errores comunes
      if (error.message && error.message.includes('function realizar_arqueo_caja')) {
        alert(
          'Error: La función SQL no está creada.\n\n' +
          'Por favor, ejecuta este SQL en el editor SQL de Supabase:\n\n' +
          'CREATE OR REPLACE FUNCTION realizar_arqueo_caja(\n' +
          '  p_efectivo_contado numeric,\n' +
          '  p_usuario_nombre text DEFAULT \'Sistema\'\n' +
          ') RETURNS json AS $$\n' +
          '-- (código SQL que te proporcioné anteriormente)\n' +
          '$$ LANGUAGE plpgsql SECURITY DEFINER;'
        )
      } else if (error.message && error.message.includes('column')) {
        alert(
          'Error: Faltan columnas en la tabla.\n\n' +
          'Ejecuta este SQL en Supabase:\n\n' +
          'ALTER TABLE arqueos \n' +
          'ADD COLUMN IF NOT EXISTS ventas_eliminadas integer DEFAULT 0,\n' +
          'ADD COLUMN IF NOT EXISTS abonos_efectivo_eliminados integer DEFAULT 0,\n' +
          'ADD COLUMN IF NOT EXISTS gastos_eliminados integer DEFAULT 0,\n' +
          'ADD COLUMN IF NOT EXISTS periodo_desde text,\n' +
          'ADD COLUMN IF NOT EXISTS periodo_hasta text,\n' +
          'ADD COLUMN IF NOT EXISTS diferencia_efectivo numeric(10,2) DEFAULT 0,\n' +
          'ADD COLUMN IF NOT EXISTS usuario text DEFAULT \'Sistema\';'
        )
      } else {
        alert(`Error: ${error.message || 'No se pudo completar el arqueo'}`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Formatear fecha Nicaragua
  const formatFechaNicaragua = (fechaISO) => {
    if (!fechaISO) return 'Fecha no disponible'
    
    const fechaUTC = new Date(fechaISO)
    const fechaNicaragua = new Date(fechaUTC.getTime() - (6 * 60 * 60 * 1000))
    
    const dia = fechaNicaragua.getDate().toString().padStart(2, '0')
    const mes = (fechaNicaragua.getMonth() + 1).toString().padStart(2, '0')
    const año = fechaNicaragua.getFullYear()
    
    let horas = fechaNicaragua.getHours()
    const minutos = fechaNicaragua.getMinutes().toString().padStart(2, '0')
    const ampm = horas >= 12 ? 'p.m.' : 'a.m.'
    
    horas = horas % 12
    horas = horas ? horas.toString().padStart(2, '0') : '12'
    
    return `${dia}/${mes}/${año}, ${horas}:${minutos} ${ampm}`
  }

  return (
    <div className="arqueos-container">
      <div className="arqueos-header">
        <div>
          <h1 className="arqueos-titulo">Arqueos de Caja</h1>
          <p className="arqueos-subtitulo">Cierre de turno y control de efectivo</p>
          {ultimoArqueo && (
            <div className="ultimo-arqueo-info">
              <span className="info-label">Último arqueo:</span>
              <span className="info-valor">{formatFechaNicaragua(ultimoArqueo.fecha)}</span>
            </div>
          )}
        </div>
        <button
          onClick={abrirModal}
          className="btn-arquear-turno"
          disabled={loading || calculando}
        >
          {calculando ? (
            <>
              <div className="spinner-small"></div>
              Calculando...
            </>
          ) : (
            <>
              <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Arqueo de Turno
            </>
          )}
        </button>
      </div>

      {/* Estadísticas rápidas */}
      {ultimoArqueo && (
        <div className="estadisticas-arqueo">
          <div className="estadistica-card">
            <div className="estadistica-icono">💰</div>
            <div className="estadistica-contenido">
              <p className="estadistica-valor">
                C${parseFloat(ultimoArqueo.efectivo_en_caja).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
              <p className="estadistica-label">Último efectivo</p>
            </div>
          </div>
          
          <div className="estadistica-card">
            <div className="estadistica-icono">📊</div>
            <div className="estadistica-contenido">
              <p className="estadistica-valor">{arqueos.length}</p>
              <p className="estadistica-label">Arqueos totales</p>
            </div>
          </div>
          
          <div className="estadistica-card">
            <div className="estadistica-icono">📅</div>
            <div className="estadistica-contenido">
              <p className="estadistica-valor">
                {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' })}
              </p>
              <p className="estadistica-label">Fecha actual</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de arqueos */}
      <div className="tabla-arqueos-container">
        <div className="tabla-arqueos-card">
          <div className="overflow-x-auto">
            <table className="tabla-arqueos">
              <thead>
                <tr>
                  <th className="columna-fecha">Fecha</th>
                  <th className="columna-ventas">Ventas Totales</th>
                  <th className="columna-credito">Ventas Crédito</th>
                  <th className="columna-efectivo">Efectivo Bruto</th>
                  <th className="columna-gastos">Gastos</th>
                  <th className="columna-caja">Efectivo en Caja</th>
                  <th className="columna-detalle">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="cargando-mensaje">
                      <div className="spinner"></div>
                      Cargando arqueos...
                    </td>
                  </tr>
                ) : arqueos.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="sin-registros">
                      No hay arqueos registrados
                    </td>
                  </tr>
                ) : (
                  arqueos.map((arqueo) => (
                    <tr key={arqueo.id} className="fila-arqueo">
                      <td className="celda-fecha">
                        {formatFechaNicaragua(arqueo.fecha)}
                      </td>
                      <td className="celda-ventas">
                        <span className="valor-positivo">
                          C${parseFloat(arqueo.total_ventas).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="celda-credito">
                        <span className="valor-credito">
                          C${parseFloat(arqueo.total_credito).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="celda-efectivo">
                        <span className="valor-efectivo">
                          C${parseFloat(arqueo.total_efectivo).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="celda-gastos">
                        <span className="valor-negativo">
                          C${parseFloat(arqueo.total_gastos).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="celda-caja">
                        <span className={`badge-caja ${arqueo.efectivo_en_caja > 0 ? 'positivo' : 'negativo'}`}>
                          C${parseFloat(arqueo.efectivo_en_caja).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="celda-detalle">
                        <button 
                          className="btn-detalle"
                          onClick={() => {
                            alert(
                              `📋 DETALLE DEL ARQUEO\n\n` +
                              `📅 Fecha: ${formatFechaNicaragua(arqueo.fecha)}\n` +
                              `💰 Ventas totales: C$${arqueo.total_ventas}\n` +
                              `💳 Ventas a crédito: C$${arqueo.total_credito}\n` +
                              `💵 Efectivo bruto: C$${arqueo.total_efectivo}\n` +
                              `📉 Gastos: C$${arqueo.total_gastos}\n` +
                              `🏦 Efectivo en caja: C$${arqueo.efectivo_en_caja}\n` +
                              (arqueo.ventas_eliminadas ? `📊 Ventas eliminadas: ${arqueo.ventas_eliminadas}\n` : '') +
                              (arqueo.abonos_efectivo_eliminados ? `💸 Abonos eliminados: ${arqueo.abonos_efectivo_eliminados}\n` : '') +
                              (arqueo.gastos_eliminados ? `📋 Gastos eliminados: ${arqueo.gastos_eliminados}\n` : '')
                            )
                          }}
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal para arqueo de turno */}
      {modalAbierto && resumenTurno && (
        <div className="modal-overlay">
          <div className="modal-container arqueo-modal">
            <div className="modal-header">
              <h3 className="modal-titulo">Arqueo de Turno</h3>
              <button onClick={cerrarModal} className="modal-cerrar">
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="periodo-info">
                <p className="periodo-texto">
                  <strong>Período:</strong> Desde {resumenTurno.fechaDesde} hasta {resumenTurno.fechaHasta}
                </p>
              </div>
              
              <div className="resumen-grid">
                {/* Columna izquierda - Ingresos */}
                <div className="resumen-columna ingresos-col">
                  <h4 className="resumen-subtitulo">📈 INGRESOS</h4>
                  
                  <div className="resumen-item">
                    <span className="resumen-label">Ventas en efectivo:</span>
                    <span className="resumen-valor positivo">
                      C${resumenTurno.totalVentasEfectivo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="resumen-cantidad">({resumenTurno.cantidadVentas} ventas)</span>
                  </div>
                  
                  <div className="resumen-item">
                    <span className="resumen-label">Abonos en efectivo:</span>
                    <span className="resumen-valor positivo">
                      C${resumenTurno.totalAbonosEfectivo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="resumen-cantidad">({resumenTurno.cantidadAbonosEfectivo} abonos)</span>
                  </div>
                  
                  <div className="resumen-item">
                    <span className="resumen-label">Ventas a crédito:</span>
                    <span className="resumen-valor credito">
                      C${resumenTurno.totalCreditos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="resumen-cantidad">({resumenTurno.cantidadCreditos} créditos) 🔒</span>
                  </div>
                  
                  <div className="resumen-item">
                    <span className="resumen-label">Abonos otros métodos:</span>
                    <span className="resumen-valor">
                      C${resumenTurno.totalAbonosOtros.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="resumen-cantidad">({resumenTurno.cantidadAbonosOtros} abonos) 🔒</span>
                  </div>
                  
                  <div className="resumen-total">
                    <span className="total-label">TOTAL INGRESOS:</span>
                    <span className="total-valor">
                      C${(resumenTurno.totalVentasGeneral + resumenTurno.totalAbonosEfectivo + resumenTurno.totalAbonosOtros).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                
                {/* Columna derecha - Egresos y resultado */}
                <div className="resumen-columna egresos-col">
                  <h4 className="resumen-subtitulo">📉 EGRESOS</h4>
                  
                  <div className="resumen-item">
                    <span className="resumen-label">Gastos:</span>
                    <span className="resumen-valor negativo">
                      C${resumenTurno.totalGastos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="resumen-cantidad">({resumenTurno.cantidadGastos} gastos)</span>
                  </div>
                  
                  <div className="resumen-separador"></div>
                  
                  <div className="resumen-calculo">
                    <div className="calculo-item">
                      <span>Efectivo bruto:</span>
                      <span>C${resumenTurno.totalEfectivo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="calculo-item">
                      <span>- Gastos:</span>
                      <span>C${resumenTurno.totalGastos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="calculo-total">
                      <span>EFECTIVO NETO ESPERADO:</span>
                      <span className="neto-esperado">
                        C${resumenTurno.efectivoNeto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="efectivo-contado">
                    <label className="contado-label">
                      💵 EFECTIVO REAL CONTADO:
                    </label>
                    <div className="contado-input-container">
                      <span className="contado-prefijo">C$</span>
                      <input
                        type="number"
                        value={efectivoContado}
                        onChange={(e) => setEfectivoContado(e.target.value)}
                        className="contado-input"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        autoFocus
                      />
                    </div>
                    
                    {efectivoContado && resumenTurno.efectivoNeto && (
                      <div className="diferencia">
                        <span>Diferencia:</span>
                        <span className={`diferencia-valor ${(parseFloat(efectivoContado) - resumenTurno.efectivoNeto) >= 0 ? 'positivo' : 'negativo'}`}>
                          C${(parseFloat(efectivoContado) - resumenTurno.efectivoNeto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="advertencia-arqueo">
                <p className="advertencia-texto">
                  ⚠️ <strong>ATENCIÓN:</strong> Al confirmar este arqueo se eliminarán automáticamente:
                </p>
                <ul className="advertencia-lista">
                  <li><span className="eliminar-item">🗑️ {resumenTurno.cantidadVentas} ventas en efectivo</span></li>
                  <li><span className="eliminar-item">🗑️ {resumenTurno.cantidadAbonosEfectivo} abonos en efectivo</span></li>
                  <li><span className="eliminar-item">🗑️ {resumenTurno.cantidadGastos} gastos</span></li>
                  <li><span className="mantener-item">✅ {resumenTurno.cantidadCreditos} créditos activos (se mantienen)</span></li>
                  <li><span className="mantener-item">✅ {resumenTurno.cantidadAbonosOtros} abonos otros métodos (se mantienen)</span></li>
                </ul>
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                onClick={cerrarModal}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={realizarArqueo}
                className="btn btn-success"
                disabled={!efectivoContado || loading}
              >
                {loading ? (
                  <>
                    <div className="spinner-small"></div>
                    Procesando...
                  </>
                ) : (
                  '✅ Confirmar Arqueo de Turno'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Arqueos