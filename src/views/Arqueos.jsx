import { useState, useEffect } from 'react'
import { supabase } from '../database/supabase'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import './Arqueos.css'

const Arqueos = () => {
  const [arqueos, setArqueos] = useState([])
  const [loading, setLoading] = useState(true)
  const [calculando, setCalculando] = useState(false)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [resumenTurno, setResumenTurno] = useState(null)
  const [efectivoContado, setEfectivoContado] = useState('')
  const [ultimoArqueo, setUltimoArqueo] = useState(null)
  const [exportando, setExportando] = useState({})
  const [busqueda, setBusqueda] = useState('')
  
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
      
      let fechaDesde = new Date()
      fechaDesde.setHours(0, 0, 0, 0)
      const fechaHasta = new Date()
      
      // Obtener SOLO abonos NO procesados en arqueo
      const [ventasResp, creditosResp, abonosResp, gastosResp] = await Promise.all([
        supabase.from('ventas').select('*').gte('fecha', fechaDesde.toISOString()),
        supabase.from('ventas_credito').select('*').gte('fecha', fechaDesde.toISOString()),
        supabase.from('abonos_credito').select('*')
          .gte('fecha', fechaDesde.toISOString())
          .is('procesado_en_arqueo', false),
        supabase.from('gastos').select('*').gte('fecha', fechaDesde.toISOString())
      ])
      
      const ventas = ventasResp.data || []
      const creditos = creditosResp.data || []
      const abonos = abonosResp.data || []
      const gastos = gastosResp.data || []
      
      // ============ CALCULAR VENTAS POR MÉTODO DE PAGO ============
      let totalVentasEfectivo = 0
      let totalVentasTarjeta = 0
      let totalVentasTransferencia = 0
      
      let cantidadVentasEfectivo = 0
      let cantidadVentasTarjeta = 0
      let cantidadVentasTransferencia = 0
      
      // Contadores específicos para cada método
      ventas.forEach(venta => {
        switch(venta.metodo_pago) {
          case 'efectivo':
            totalVentasEfectivo += parseFloat(venta.total) || 0
            cantidadVentasEfectivo++
            break
          case 'tarjeta':
            totalVentasTarjeta += parseFloat(venta.total) || 0
            cantidadVentasTarjeta++
            break
          case 'transferencia':
            totalVentasTransferencia += parseFloat(venta.total) || 0
            cantidadVentasTransferencia++
            break
          case 'mixto':
            // Para ventas mixtas, sumar a cada método según corresponda
            totalVentasEfectivo += parseFloat(venta.efectivo) || 0
            totalVentasTarjeta += parseFloat(venta.tarjeta) || 0
            totalVentasTransferencia += parseFloat(venta.transferencia) || 0
            
            // CONTAR LA VENTA COMPLETA (1 venta total)
            // Pero sumar cantidades a cada método si tiene monto
            if (parseFloat(venta.efectivo) > 0) cantidadVentasEfectivo++
            if (parseFloat(venta.tarjeta) > 0) cantidadVentasTarjeta++
            if (parseFloat(venta.transferencia) > 0) cantidadVentasTransferencia++
            break
        }
      })
      
      // ============ CALCULAR ABONOS POR MÉTODO DE PAGO ============
      let abonosEfectivo = 0
      let abonosTarjeta = 0
      let abonosTransferencia = 0
      
      let cantidadAbonosEfectivo = 0
      let cantidadAbonosTarjeta = 0
      let cantidadAbonosTransferencia = 0
      
      // CORRECCIÓN IMPORTANTE: Aquí estaba el error
      abonos.forEach(abono => {
        switch(abono.metodo_pago) {
          case 'efectivo':
            abonosEfectivo += parseFloat(abono.monto) || 0
            cantidadAbonosEfectivo++  // ¡ESTE CONTADOR SÍ DEBE INCREMENTAR!
            break
          case 'tarjeta':
            abonosTarjeta += parseFloat(abono.monto) || 0
            cantidadAbonosTarjeta++  // ¡ESTE CONTADOR SÍ DEBE INCREMENTAR!
            break
          case 'transferencia':
            abonosTransferencia += parseFloat(abono.monto) || 0
            cantidadAbonosTransferencia++  // ¡ESTE CONTADOR SÍ DEBE INCREMENTAR!
            break
          case 'mixto':
            // Para abonos mixtos, dividir por método
            abonosEfectivo += parseFloat(abono.efectivo) || 0
            abonosTarjeta += parseFloat(abono.tarjeta) || 0
            abonosTransferencia += parseFloat(abono.transferencia) || 0
            
            // CONTAR CADA MÉTODO SI TIENE MONTO
            if (parseFloat(abono.efectivo) > 0) cantidadAbonosEfectivo++
            if (parseFloat(abono.tarjeta) > 0) cantidadAbonosTarjeta++
            if (parseFloat(abono.transferencia) > 0) cantidadAbonosTransferencia++
            break
        }
      })
      
      const totalCreditos = creditos.reduce((s, c) => s + (parseFloat(c.total) || 0), 0)
      const totalGastos = gastos.reduce((s, g) => s + (parseFloat(g.monto) || 0), 0)
      
      const resumen = {
        // Totales por método de pago
        totalVentasEfectivo,
        totalVentasTarjeta,
        totalVentasTransferencia,
        
        totalAbonosEfectivo: abonosEfectivo,
        abonosTarjeta,
        abonosTransferencia,
        
        totalCreditos,
        totalGastos,
        
        // Cálculo de efectivo para arqueo
        efectivoNeto: totalVentasEfectivo + abonosEfectivo - totalGastos,
        totalEfectivo: totalVentasEfectivo + abonosEfectivo,
        
        // Cantidades CORREGIDAS
        cantidadVentas: ventas.length,
        cantidadVentasEfectivo,
        cantidadVentasTarjeta,
        cantidadVentasTransferencia,
        
        cantidadCreditos: creditos.length,
        
        // ¡¡¡CANTIDADES CORREGIDAS!!!
        cantidadAbonosEfectivo,
        cantidadAbonosTarjeta,
        cantidadAbonosTransferencia,
        
        cantidadGastos: gastos.length,
        
        // Fechas
        fechaDesde: fechaDesde.toLocaleString('es-MX'),
        fechaHasta: fechaHasta.toLocaleString('es-MX'),
        
        // Totales generales
        totalVentasGeneral: totalVentasEfectivo + totalVentasTarjeta + totalVentasTransferencia,
        totalAbonosGeneral: abonosEfectivo + abonosTarjeta + abonosTransferencia
      }
      
      setResumenTurno(resumen)
      setEfectivoContado((totalVentasEfectivo + abonosEfectivo - totalGastos).toFixed(2))
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
    
    // Mensaje de confirmación
    const mensajeConfirmacion = 
      `¿CONFIRMAR ARQUEO DE TURNO?\n\n` +
      `📊 RESUMEN DEL DÍA COMPLETO:\n` +
      `• Ventas en efectivo: C$${resumenTurno?.totalVentasEfectivo.toFixed(2)} ` +
      `(${resumenTurno?.cantidadVentasEfectivo} ventas)\n` +
      `• Abonos en efectivo: C$${resumenTurno?.totalAbonosEfectivo.toFixed(2)} ` +
      `(${resumenTurno?.cantidadAbonosEfectivo} abonos)\n` +
      `• Gastos: C$${resumenTurno?.totalGastos.toFixed(2)} ` +
      `(${resumenTurno?.cantidadGastos} gastos)\n` +
      `• Efectivo neto esperado: C$${resumenTurno?.efectivoNeto.toFixed(2)}\n` +
      `• Efectivo contado: C$${efectivo.toFixed(2)}\n` +
      `\n⚠️ Esta acción es IRREVERSIBLE y eliminará:\n` +
      `• ${resumenTurno?.cantidadVentas} ventas del día\n` +
      `• ${resumenTurno?.cantidadGastos} gastos del día\n` +
      `• ${resumenTurno?.cantidadAbonosEfectivo + resumenTurno?.cantidadAbonosTarjeta + resumenTurno?.cantidadAbonosTransferencia} abonos del día\n\n` +
      `¿Continuar?`
    
    const confirmar = window.confirm(mensajeConfirmacion)
    if (!confirmar) return
    
    try {
      setLoading(true)
      
      // **LLAMAR A LA FUNCIÓN DE ARQUEO ACTUALIZADA**
      const { data, error } = await supabase.rpc('realizar_arqueo_caja_completa', {
        p_efectivo_contado: efectivo,
        p_usuario_nombre: usuario
      })
      
      if (error) throw error
      
      if (!data.success) {
        throw new Error(data.error || 'Error en el arqueo')
      }
      
      const diferencia = data.diferencia || 0
      const resumen = data.resumen || {}
      
      const mensajeExito = 
        `✅ ARQUEO COMPLETADO\n\n` +
        `💰 RESULTADO DE EFECTIVO EN CAJA:\n` +
        `• Ventas en efectivo: C$${(resumen.total_ventas_efectivo || 0).toFixed(2)} ` +
        `(${resumen.cantidad_ventas_efectivo || 0} ventas)\n` +
        `• Abonos en efectivo: C$${(resumen.total_abonos_efectivo || 0).toFixed(2)} ` +
        `(${resumen.cantidad_abonos_efectivo || 0} abonos)\n` +
        `• Gastos: C$${(resumen.total_gastos || 0).toFixed(2)} ` +
        `(${resumen.cantidad_gastos || 0} gastos)\n` +
        `• Efectivo neto esperado: C$${(resumen.efectivo_neto || 0).toFixed(2)}\n` +
        `• Efectivo contado: C$${efectivo.toFixed(2)}\n` +
        (diferencia !== 0 ? 
          `• Diferencia: C$${Math.abs(diferencia).toFixed(2)} ${diferencia > 0 ? '(Sobrante)' : '(Faltante)'}\n` : '') +
        `\n🗑️ REGISTROS ELIMINADOS:\n` +
        `• ${resumen.cantidad_ventas || 0} ventas eliminadas\n` +
        `• ${resumen.cantidad_gastos || 0} gastos eliminados\n` +
        `• ${(resumen.cantidad_abonos_efectivo || 0) + (resumen.cantidad_abonos_tarjeta || 0) + (resumen.cantidad_abonos_transferencia || 0)} abonos procesados`
      
      alert(mensajeExito)
      
      setModalAbierto(false)
      setResumenTurno(null)
      setEfectivoContado('')
      cargarArqueos()
      
    } catch (error) {
      console.error('Error en arqueo:', error)
      alert(`❌ ERROR: ${error.message || 'No se pudo completar el arqueo'}`)
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
    
    return `${dia}/${mes}/${año} ${horas}:${minutos} ${ampm}`
  }

  // Formatear fecha corta para móvil
  const formatFechaCorta = (fechaISO) => {
    if (!fechaISO) return 'Fecha no disponible'
    
    const fechaUTC = new Date(fechaISO)
    const fechaNicaragua = new Date(fechaUTC.getTime() - (6 * 60 * 60 * 1000))
    
    const dia = fechaNicaragua.getDate().toString().padStart(2, '0')
    const mes = (fechaNicaragua.getMonth() + 1).toString().padStart(2, '0')
    const año = fechaNicaragua.getFullYear().toString().slice(-2)
    
    let horas = fechaNicaragua.getHours()
    const minutos = fechaNicaragua.getMinutes().toString().padStart(2, '0')
    
    return `${dia}/${mes}/${año} ${horas}:${minutos}`
  }

  // Filtrar arqueos por búsqueda
  const arqueosFiltrados = arqueos.filter(arqueo => {
    if (!busqueda.trim()) return true;
    
    const searchTerm = busqueda.toLowerCase();
    const fecha = formatFechaNicaragua(arqueo.fecha).toLowerCase();
    const usuario = (arqueo.usuario || '').toLowerCase();
    
    return (
      fecha.includes(searchTerm) ||
      usuario.includes(searchTerm) ||
      arqueo.id.toLowerCase().includes(searchTerm)
    );
  });

  // Exportar UN arqueo a Excel
  const exportarArqueoExcel = async (arqueo) => {
    try {
      setExportando(prev => ({ ...prev, [arqueo.id]: 'excel' }))
      
      const datos = [{
        'Fecha': formatFechaNicaragua(arqueo.fecha),
        'Ventas Totales': `C$${parseFloat(arqueo.total_ventas).toFixed(2)}`,
        'Ventas Crédito': `C$${parseFloat(arqueo.total_credito).toFixed(2)}`,
        'Efectivo Bruto': `C$${parseFloat(arqueo.total_efectivo).toFixed(2)}`,
        'Gastos': `C$${parseFloat(arqueo.total_gastos).toFixed(2)}`,
        'Efectivo en Caja': `C$${parseFloat(arqueo.efectivo_en_caja).toFixed(2)}`,
        'Diferencia': `C$${parseFloat(arqueo.diferencia_efectivo || 0).toFixed(2)}`,
        'Usuario': arqueo.usuario || 'Sistema',
        'Ventas Eliminadas': arqueo.ventas_eliminadas || 0,
        'Gastos Eliminados': arqueo.gastos_eliminados || 0,
        'Abonos Tarjeta': arqueo.total_abonos_tarjeta || 0,
        'Abonos Transferencia': arqueo.total_abonos_transferencia || 0,
        'Período Desde': arqueo.periodo_desde || '',
        'Período Hasta': arqueo.periodo_hasta || ''
      }]
      
      const ws = XLSX.utils.json_to_sheet(datos)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Arqueo')
      
      const fechaFormateada = formatFechaNicaragua(arqueo.fecha)
        .replace(/[/: ]/g, '-')
        .replace(/[a.m.p.m]/g, '')
      
      XLSX.writeFile(wb, `arqueo-${fechaFormateada}.xlsx`)
      
      setTimeout(() => {
        setExportando(prev => ({ ...prev, [arqueo.id]: null }))
      }, 1000)
      
    } catch (error) {
      console.error('Error exportando Excel:', error)
      alert('Error al exportar a Excel')
      setExportando(prev => ({ ...prev, [arqueo.id]: null }))
    }
  }

  // Exportar UN arqueo a PDF
  const exportarArqueoPDF = async (arqueo) => {
    try {
      setExportando(prev => ({ ...prev, [arqueo.id]: 'pdf' }))
      
      // Crear PDF con jsPDF
      const doc = new jsPDF()
      
      const fecha = formatFechaNicaragua(arqueo.fecha)
      const fechaArchivo = fecha.replace(/[/: ]/g, '-').replace(/[a.m.p.m]/g, '')
      
      // Configuración de colores
      const colorPrimario = [139, 92, 246] // Morado
      const colorSecundario = [59, 130, 246] // Azul
      
      // Título
      doc.setFontSize(20)
      doc.setTextColor(...colorPrimario)
      doc.text('COMPROBANTE DE ARQUEO', 105, 20, { align: 'center' })
      
      doc.setFontSize(12)
      doc.setTextColor(100, 116, 139)
      doc.text('Arelyz Salón - Sistema de Caja', 105, 30, { align: 'center' })
      
      // Línea separadora
      doc.setDrawColor(...colorPrimario)
      doc.setLineWidth(0.5)
      doc.line(20, 35, 190, 35)
      
      // Información básica
      doc.setFontSize(14)
      doc.setTextColor(30, 41, 59)
      doc.text(`Fecha del Arqueo: ${fecha}`, 20, 45)
      doc.text(`Usuario: ${arqueo.usuario || 'Sistema'}`, 20, 55)
      
      doc.setFontSize(10)
      doc.setTextColor(100, 116, 139)
      doc.text(`ID: ${arqueo.id.substring(0, 8)}...`, 150, 45)
      doc.text(`Período: ${arqueo.periodo_desde || 'N/A'} - ${arqueo.periodo_hasta || 'N/A'}`, 150, 55)
      
      // Resumen financiero
      doc.setFontSize(16)
      doc.setTextColor(...colorSecundario)
      doc.text('RESUMEN FINANCIERO', 20, 70)
      
      doc.setFontSize(11)
      doc.setTextColor(30, 41, 59)
      
      // Datos en dos columnas
      const datos = [
        { label: 'VENTAS TOTALES', value: `C$${parseFloat(arqueo.total_ventas).toFixed(2)}`, color: [30, 41, 59] },
        { label: 'Ventas Crédito', value: `C$${parseFloat(arqueo.total_credito).toFixed(2)}`, color: [100, 116, 139] },
        { label: 'EFECTIVO BRUTO', value: `C$${parseFloat(arqueo.total_efectivo).toFixed(2)}`, color: [30, 41, 59] },
        { label: 'GASTOS', value: `C$${parseFloat(arqueo.total_gastos).toFixed(2)}`, color: [239, 68, 68] },
        { label: 'EFECTIVO EN CAJA', value: `C$${parseFloat(arqueo.efectivo_en_caja).toFixed(2)}`, 
          color: parseFloat(arqueo.efectivo_en_caja) > 0 ? [16, 185, 129] : [239, 68, 68] },
        { label: 'DIFERENCIA', value: `C$${parseFloat(arqueo.diferencia_efectivo || 0).toFixed(2)}`, 
          color: parseFloat(arqueo.diferencia_efectivo || 0) >= 0 ? [16, 185, 129] : [239, 68, 68] },
      ]
      
      let y = 85
      datos.forEach((item, index) => {
        const x = index % 2 === 0 ? 20 : 110
        
        // Fondo para encabezados
        if (item.label === item.label.toUpperCase()) {
          doc.setFillColor(248, 250, 252)
          doc.rect(x - 2, y - 6, 80, 8, 'F')
        }
        
        doc.setTextColor(100, 116, 139)
        doc.setFontSize(9)
        doc.text(item.label, x, y)
        
        doc.setTextColor(...item.color)
        doc.setFontSize(11)
        doc.setFont(undefined, 'bold')
        doc.text(item.value, x, y + 5)
        doc.setFont(undefined, 'normal')
        
        if (index % 2 === 1) y += 15
      })
      
      // Detalles adicionales
      y = Math.max(y, 145)
      doc.setFontSize(12)
      doc.setTextColor(...colorSecundario)
      doc.text('DETALLES ADICIONALES', 20, y)
      
      doc.setFontSize(10)
      doc.setTextColor(30, 41, 59)
      
      const detalles = [
        `• Ventas eliminadas: ${arqueo.ventas_eliminadas || 0}`,
        `• Gastos eliminados: ${arqueo.gastos_eliminados || 0}`,
        `• Abonos con tarjeta: C$${parseFloat(arqueo.total_abonos_tarjeta || 0).toFixed(2)}`,
        `• Abonos con transferencia: C$${parseFloat(arqueo.total_abonos_transferencia || 0).toFixed(2)}`
      ]
      
      detalles.forEach((detalle, index) => {
        doc.text(detalle, 25, y + 10 + (index * 6))
      })
      
      // Pie de página
      const pageHeight = doc.internal.pageSize.height
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text('Documento generado automáticamente por el Sistema Arelyz Salón', 105, pageHeight - 20, { align: 'center' })
      doc.text('Este comprobante es válido como registro oficial de arqueo de caja', 105, pageHeight - 15, { align: 'center' })
      
      // Marca de agua
      doc.setFontSize(50)
      doc.setTextColor(248, 250, 252)
      doc.setGState(new doc.GState({ opacity: 0.1 }))
      doc.text('ARElyZ', 105, pageHeight / 2, { align: 'center', angle: 45 })
      doc.setGState(new doc.GState({ opacity: 1 }))
      
      // Guardar PDF
      doc.save(`arqueo-${fechaArchivo}.pdf`)
      
      setTimeout(() => {
        setExportando(prev => ({ ...prev, [arqueo.id]: null }))
      }, 1000)
      
    } catch (error) {
      console.error('Error exportando PDF:', error)
      alert('Error al exportar a PDF')
      setExportando(prev => ({ ...prev, [arqueo.id]: null }))
    }
  }

  // Mostrar detalles del arqueo en móvil
  const mostrarDetallesMobile = (arqueo) => {
    const diferencia = parseFloat(arqueo.diferencia_efectivo || 0)
    
    return (
      <div className="arqueo-detalle-mobile">
        <div className="detalle-grid-mobile">
          <div className="detalle-item-mobile">
            <span className="detalle-label-mobile">Fecha</span>
            <span className="detalle-valor-mobile">{formatFechaCorta(arqueo.fecha)}</span>
          </div>
          <div className="detalle-item-mobile">
            <span className="detalle-label-mobile">Usuario</span>
            <span className="detalle-valor-mobile">{arqueo.usuario || 'Sistema'}</span>
          </div>
          <div className="detalle-item-mobile">
            <span className="detalle-label-mobile">Ventas Totales</span>
            <span className="detalle-valor-mobile positivo">
              C${parseFloat(arqueo.total_ventas).toFixed(2)}
            </span>
          </div>
          <div className="detalle-item-mobile">
            <span className="detalle-label-mobile">Efectivo Bruto</span>
            <span className="detalle-valor-mobile efectivo">
              C${parseFloat(arqueo.total_efectivo).toFixed(2)}
            </span>
          </div>
          <div className="detalle-item-mobile">
            <span className="detalle-label-mobile">Gastos</span>
            <span className="detalle-valor-mobile negativo">
              C${parseFloat(arqueo.total_gastos).toFixed(2)}
            </span>
          </div>
          <div className="detalle-item-mobile">
            <span className="detalle-label-mobile">Efectivo en Caja</span>
            <span className={`detalle-valor-mobile ${parseFloat(arqueo.efectivo_en_caja) > 0 ? 'positivo' : 'negativo'}`}>
              C${parseFloat(arqueo.efectivo_en_caja).toFixed(2)}
            </span>
          </div>
          {diferencia !== 0 && (
            <div className="detalle-item-mobile full-width">
              <span className="detalle-label-mobile">Diferencia</span>
              <span className={`detalle-valor-mobile ${diferencia > 0 ? 'positivo' : 'negativo'}`}>
                C${Math.abs(diferencia).toFixed(2)} {diferencia > 0 ? '(Sobrante)' : '(Faltante)'}
              </span>
            </div>
          )}
        </div>
        <div className="detalle-actions-mobile">
          <button
            onClick={() => exportarArqueoExcel(arqueo)}
            disabled={exportando[arqueo.id] === 'excel'}
            className="detalle-action-btn-mobile excel"
          >
            {exportando[arqueo.id] === 'excel' ? (
              <>
                <div className="spinner-mini"></div>
                Exportando...
              </>
            ) : (
              <>
                📊 Excel
              </>
            )}
          </button>
          <button
            onClick={() => exportarArqueoPDF(arqueo)}
            disabled={exportando[arqueo.id] === 'pdf'}
            className="detalle-action-btn-mobile pdf"
          >
            {exportando[arqueo.id] === 'pdf' ? (
              <>
                <div className="spinner-mini"></div>
                Exportando...
              </>
            ) : (
              <>
                📄 PDF
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  // Renderizar arqueos para vista móvil
  const renderArqueosMobile = () => {
    if (loading) {
      return (
        <div className="sin-resultados-mobile">
          <div className="spinner"></div>
          <p>Cargando arqueos...</p>
        </div>
      );
    }

    if (arqueosFiltrados.length === 0) {
      return (
        <div className="sin-resultados-mobile">
          <p>{busqueda ? 'No se encontraron arqueos' : 'No hay arqueos registrados'}</p>
        </div>
      );
    }

    return arqueosFiltrados.map((arqueo) => {
      const diferencia = parseFloat(arqueo.diferencia_efectivo || 0)
      
      return (
        <div key={arqueo.id} className="arqueo-card-mobile">
          <div className="arqueo-card-header">
            <div className="arqueo-fecha-mobile">
              <span className="fecha-dia">{formatFechaCorta(arqueo.fecha)}</span>
              <span className="fecha-usuario">{arqueo.usuario || 'Sistema'}</span>
            </div>
            <div className={`arqueo-estado-mobile ${diferencia === 0 ? 'exacto' : diferencia > 0 ? 'sobrante' : 'faltante'}`}>
              {diferencia === 0 ? '✅' : diferencia > 0 ? '💰' : '📉'}
            </div>
          </div>
          
          <div className="arqueo-resumen-mobile">
            <div className="resumen-row">
              <div className="resumen-col">
                <span className="resumen-label-mobile">Ventas</span>
                <span className="resumen-valor-mobile positivo">
                  C${parseFloat(arqueo.total_ventas).toFixed(2)}
                </span>
              </div>
              <div className="resumen-col">
                <span className="resumen-label-mobile">Efectivo</span>
                <span className="resumen-valor-mobile efectivo">
                  C${parseFloat(arqueo.total_efectivo).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="resumen-row">
              <div className="resumen-col">
                <span className="resumen-label-mobile">Gastos</span>
                <span className="resumen-valor-mobile negativo">
                  C${parseFloat(arqueo.total_gastos).toFixed(2)}
                </span>
              </div>
              <div className="resumen-col">
                <span className="resumen-label-mobile">En Caja</span>
                <span className={`resumen-valor-mobile ${parseFloat(arqueo.efectivo_en_caja) > 0 ? 'positivo' : 'negativo'}`}>
                  C${parseFloat(arqueo.efectivo_en_caja).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
          {mostrarDetallesMobile(arqueo)}
        </div>
      );
    });
  };

  // Calcular resumen para móvil
  const calcularResumenMobile = () => {
    const totalArqueos = arqueosFiltrados.length;
    const totalVentas = arqueosFiltrados.reduce((sum, arqueo) => sum + parseFloat(arqueo.total_ventas), 0);
    const totalGastos = arqueosFiltrados.reduce((sum, arqueo) => sum + parseFloat(arqueo.total_gastos), 0);
    const totalEfectivo = arqueosFiltrados.reduce((sum, arqueo) => sum + parseFloat(arqueo.efectivo_en_caja), 0);

    return { totalArqueos, totalVentas, totalGastos, totalEfectivo };
  };

  const resumenMobile = calcularResumenMobile();

  return (
    <div className="arqueos-container">
      {/* BUSCADOR PARA MÓVIL */}
      <div className="buscador-mobile mobile-only">
        <div className="buscador-mobile-container">
          <svg className="buscador-mobile-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por fecha o usuario..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="buscador-mobile-input"
          />
          {busqueda && (
            <button 
              onClick={() => setBusqueda('')}
              className="buscador-mobile-limpiar"
              title="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="arqueos-header">
        <div>
          <h1 className="arqueos-titulo">Arqueos de Caja</h1>
          <p className="arqueos-subtitulo">Cierre de turno y control de efectivo</p>
          {ultimoArqueo && (
            <div className="ultimo-arqueo-info desktop-only">
              <span className="info-label">Último arqueo:</span>
              <span className="info-valor">{formatFechaNicaragua(ultimoArqueo.fecha)}</span>
            </div>
          )}
        </div>
        
        <div className="header-buttons">
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
                💰 Arqueo de Turno
              </>
            )}
          </button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      {ultimoArqueo && (
        <div className="estadisticas-arqueo desktop-only">
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
            <div className="estadistica-icono">📈</div>
            <div className="estadistica-contenido">
              <p className="estadistica-valor">
                C${arqueos.reduce((sum, a) => sum + parseFloat(a.total_ventas || 0), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
              <p className="estadistica-label">Total ventas</p>
            </div>
          </div>
          
          <div className="estadistica-card">
            <div className="estadistica-icono">📉</div>
            <div className="estadistica-contenido">
              <p className="estadistica-valor">
                C${arqueos.reduce((sum, a) => sum + parseFloat(a.total_gastos || 0), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
              <p className="estadistica-label">Total gastos</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de arqueos */}
      <div className="tabla-arqueos-container">
        <div className="tabla-arqueos-card">
          {/* VISTA DESKTOP/TABLET */}
          <div className="tabla-scroll-container desktop-only">
            <table className="tabla-arqueos">
              <thead>
                <tr>
                  <th className="columna-fecha">Fecha</th>
                  <th className="columna-ventas">Ventas Totales</th>
                  <th className="columna-credito">Ventas Crédito</th>
                  <th className="columna-efectivo">Efectivo Bruto</th>
                  <th className="columna-gastos">Gastos</th>
                  <th className="columna-caja">Efectivo en Caja</th>
                  <th className="columna-acciones">Acciones</th>
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
                ) : arqueosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="sin-registros">
                      {busqueda ? 'No se encontraron arqueos con esa búsqueda' : 'No hay arqueos registrados'}
                    </td>
                  </tr>
                ) : (
                  arqueosFiltrados.map((arqueo) => (
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
                        <span className={`badge-caja ${parseFloat(arqueo.efectivo_en_caja) > 0 ? 'positivo' : 'negativo'}`}>
                          C${parseFloat(arqueo.efectivo_en_caja).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="celda-acciones">
                        <div className="acciones-container">
                          <button 
                            className="btn-accion btn-excel"
                            onClick={() => exportarArqueoExcel(arqueo)}
                            disabled={exportando[arqueo.id] === 'excel'}
                            title="Exportar a Excel"
                          >
                            {exportando[arqueo.id] === 'excel' ? (
                              <>
                                <span className="spinner-mini"></span>
                                <span className="btn-text">Exportando...</span>
                              </>
                            ) : (
                              <>
                                <span className="btn-icon">📊</span>
                                <span className="btn-text">Excel</span>
                              </>
                            )}
                          </button>
                          
                          <button 
                            className="btn-accion btn-pdf"
                            onClick={() => exportarArqueoPDF(arqueo)}
                            disabled={exportando[arqueo.id] === 'pdf'}
                            title="Exportar a PDF"
                          >
                            {exportando[arqueo.id] === 'pdf' ? (
                              <>
                                <span className="spinner-mini"></span>
                                <span className="btn-text">Exportando...</span>
                              </>
                            ) : (
                              <>
                                <span className="btn-icon">📄</span>
                                <span className="btn-text">PDF</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* VISTA MÓVIL */}
          <div className="tabla-mobile-view mobile-only">
            {renderArqueosMobile()}
          </div>
          
          {/* RESUMEN MÓVIL */}
          {!loading && resumenMobile.totalArqueos > 0 && (
            <div className="resumen-mobile mobile-only">
              <div className="resumen-mobile-item">
                <span className="resumen-mobile-label">Arqueos</span>
                <span className="resumen-mobile-value">{resumenMobile.totalArqueos}</span>
              </div>
              <div className="resumen-mobile-item">
                <span className="resumen-mobile-label">Total Ventas</span>
                <span className="resumen-mobile-value positivo">
                  C${resumenMobile.totalVentas.toFixed(2)}
                </span>
              </div>
              <div className="resumen-mobile-item">
                <span className="resumen-mobile-label">Total Gastos</span>
                <span className="resumen-mobile-value negativo">
                  C${resumenMobile.totalGastos.toFixed(2)}
                </span>
              </div>
              <div className="resumen-mobile-item">
                <span className="resumen-mobile-label">Efectivo Total</span>
                <span className={`resumen-mobile-value ${resumenMobile.totalEfectivo > 0 ? 'positivo' : 'negativo'}`}>
                  C${resumenMobile.totalEfectivo.toFixed(2)}
                </span>
              </div>
            </div>
          )}
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
                  <h4 className="resumen-subtitulo">💰 EFECTIVO PARA CAJA</h4>
                  
                  <div className="resumen-item">
                    <span className="resumen-label">Ventas en efectivo:</span>
                    <span className="resumen-valor positivo">
                      C${resumenTurno.totalVentasEfectivo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="resumen-cantidad">({resumenTurno.cantidadVentasEfectivo} ventas)</span>
                  </div>
                  
                  <div className="resumen-item">
                    <span className="resumen-label">Abonos en efectivo:</span>
                    <span className="resumen-valor positivo">
                      C${resumenTurno.totalAbonosEfectivo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="resumen-cantidad">({resumenTurno.cantidadAbonosEfectivo} abonos)</span>
                  </div>
                  
                  <h4 className="resumen-subtitulo" style={{marginTop: '20px'}}>💳 OTROS MÉTODOS</h4>
                  
                  <div className="resumen-item">
                    <span className="resumen-label">Ventas con tarjeta:</span>
                    <span className="resumen-valor tarjeta">
                      C${resumenTurno.totalVentasTarjeta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="resumen-cantidad">({resumenTurno.cantidadVentasTarjeta} ventas)</span>
                  </div>
                  
                  <div className="resumen-item">
                    <span className="resumen-label">Ventas con transferencia:</span>
                    <span className="resumen-valor transferencia">
                      C${resumenTurno.totalVentasTransferencia.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="resumen-cantidad">({resumenTurno.cantidadVentasTransferencia} ventas)</span>
                  </div>
                  
                  <div className="resumen-item">
                    <span className="resumen-label">Abonos con tarjeta:</span>
                    <span className="resumen-valor tarjeta">
                      C${resumenTurno.abonosTarjeta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="resumen-cantidad">({resumenTurno.cantidadAbonosTarjeta} abonos)</span>
                  </div>
                  
                  <div className="resumen-item">
                    <span className="resumen-label">Abonos con transferencia:</span>
                    <span className="resumen-valor transferencia">
                      C${resumenTurno.abonosTransferencia.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="resumen-cantidad">({resumenTurno.cantidadAbonosTransferencia} abonos)</span>
                  </div>
                  
                  <div className="resumen-item">
                    <span className="resumen-label">Ventas a crédito:</span>
                    <span className="resumen-valor credito">
                      C${resumenTurno.totalCreditos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="resumen-cantidad">({resumenTurno.cantidadCreditos} créditos)</span>
                  </div>
                </div>
                
                {/* Columna derecha - Egresos y cálculo de efectivo */}
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
                    <h5 className="calculo-titulo">💰 CÁLCULO DE EFECTIVO PARA CAJA</h5>
                    <div className="calculo-item">
                      <span>Ventas en efectivo:</span>
                      <span>C${resumenTurno.totalVentasEfectivo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="calculo-item">
                      <span>+ Abonos en efectivo:</span>
                      <span>C${resumenTurno.totalAbonosEfectivo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="calculo-subtotal">
                      <span>EFECTIVO BRUTO:</span>
                      <span className="subtotal-valor">
                        C${resumenTurno.totalEfectivo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
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
                          C${Math.abs(parseFloat(efectivoContado) - resumenTurno.efectivoNeto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          {(parseFloat(efectivoContado) - resumenTurno.efectivoNeto) > 0 ? ' (Sobrante)' : ' (Faltante)'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="advertencia-arqueo">
                <p className="advertencia-texto">
                  ⚠️ <strong>ATENCIÓN:</strong> Al confirmar este arqueo se procesarán los siguientes registros:
                </p>
                <div className="advertencia-columnas">
                  <div className="advertencia-col">
                    <p className="advertencia-subtitulo">🗑️ ELIMINADOS:</p>
                    <ul className="advertencia-lista">
                      <li><span className="eliminar-item">{resumenTurno.cantidadVentas} ventas</span></li>
                      <li><span className="eliminar-item">{resumenTurno.cantidadGastos} gastos</span></li>
                    </ul>
                  </div>
                  <div className="advertencia-col">
                    <p className="advertencia-subtitulo">✅ PROCESADOS:</p>
                    <ul className="advertencia-lista">
                      <li><span className="mantener-item">{resumenTurno.cantidadAbonosEfectivo} abonos en efectivo</span></li>
                      <li><span className="mantener-item">{resumenTurno.cantidadAbonosTarjeta} abonos con tarjeta</span></li>
                      <li><span className="mantener-item">{resumenTurno.cantidadAbonosTransferencia} abonos con transferencia</span></li>
                      <li><span className="mantener-item">{resumenTurno.cantidadCreditos} créditos (mantenidos)</span></li>
                    </ul>
                  </div>
                </div>
                
                <div className="advertencia-footer">
                  <p className="advertencia-nota">
                    💾 <strong>Nota:</strong> Todo el historial se guardará en "facturados". 
                    Los abonos se marcan como procesados (no se eliminan) y solo se contabilizan UNA VEZ en el arqueo.
                  </p>
                </div>
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
                  '✅ Confirmar Arqueo'
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