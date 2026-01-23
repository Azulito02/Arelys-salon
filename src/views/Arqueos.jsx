import { useState, useEffect, useRef } from 'react'
import { supabase } from '../database/supabase'
import * as XLSX from 'xlsx'
import html2canvas from 'html2canvas'
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
      
      // Siempre desde inicio del día actual
      let fechaDesde = new Date()
      fechaDesde.setHours(0, 0, 0, 0)
      
      const fechaHasta = new Date()
      
      // Cálculo de todos los datos del día
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
      
      // Calcular totales
      const totalVentas = ventas.reduce((s, v) => s + (parseFloat(v.total) || 0), 0)
      const totalCreditos = creditos.reduce((s, c) => s + (parseFloat(c.total) || 0), 0)
      
      // Separar abonos por método
      const abonosEfectivo = abonos
        .filter(a => a.metodo_pago === 'efectivo')
        .reduce((s, a) => s + (parseFloat(a.monto) || 0), 0)
      
      const abonosTarjeta = abonos
        .filter(a => a.metodo_pago === 'tarjeta')
        .reduce((s, a) => s + (parseFloat(a.monto) || 0), 0)
      
      const abonosTransferencia = abonos
        .filter(a => a.metodo_pago === 'transferencia')
        .reduce((s, a) => s + (parseFloat(a.monto) || 0), 0)
      
      const totalGastos = gastos.reduce((s, g) => s + (parseFloat(g.monto) || 0), 0)
      
      const resumen = {
        totalVentas,
        totalCreditos,
        abonosEfectivo,
        abonosTarjeta,
        abonosTransferencia,
        totalGastos,
        efectivoNeto: totalVentas + abonosEfectivo - totalGastos,
        
        // Cantidades
        cantidadVentas: ventas.length,
        cantidadCreditos: creditos.length,
        cantidadAbonosEfectivo: abonos.filter(a => a.metodo_pago === 'efectivo').length,
        cantidadAbonosTarjeta: abonos.filter(a => a.metodo_pago === 'tarjeta').length,
        cantidadAbonosTransferencia: abonos.filter(a => a.metodo_pago === 'transferencia').length,
        cantidadGastos: gastos.length,
        
        // Fechas
        fechaDesde: fechaDesde.toLocaleString('es-MX'),
        fechaHasta: fechaHasta.toLocaleString('es-MX'),
        
        // Totales para cálculo
        totalVentasEfectivo: totalVentas,
        totalAbonosEfectivo: abonosEfectivo,
        totalEfectivo: totalVentas + abonosEfectivo
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
    
    const mensajeConfirmacion = 
      `¿CONFIRMAR ARQUEO DE TURNO?\n\n` +
      `📊 RESUMEN DE EFECTIVO:\n` +
      `• Ventas efectivo: C$${resumenTurno?.totalVentasEfectivo.toFixed(2)}\n` +
      `• Abonos efectivo: C$${resumenTurno?.totalAbonosEfectivo.toFixed(2)} ` +
      `(${resumenTurno?.cantidadAbonosEfectivo} abonos)\n` +
      `• Gastos: C$${resumenTurno?.totalGastos.toFixed(2)}\n` +
      `• Efectivo neto esperado: C$${resumenTurno?.efectivoNeto.toFixed(2)}\n` +
      `• Efectivo contado: C$${efectivo.toFixed(2)}\n` +
      `\n💳 OTROS MÉTODOS:\n` +
      `• Tarjetas: C$${resumenTurno?.abonosTarjeta.toFixed(2)} ` +
      `(${resumenTurno?.cantidadAbonosTarjeta} abonos)\n` +
      `• Transferencias: C$${resumenTurno?.abonosTransferencia.toFixed(2)} ` +
      `(${resumenTurno?.cantidadAbonosTransferencia} abonos)\n` +
      `\n⚠️ Esta acción es IRREVERSIBLE.\n` +
      `¿Continuar?`
    
    const confirmar = window.confirm(mensajeConfirmacion)
    if (!confirmar) return
    
    try {
      setLoading(true)
      
      const { data, error } = await supabase.rpc('realizar_arqueo_caja', {
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
        `📊 RESULTADO DE EFECTIVO:\n` +
        `• Ventas en efectivo: C$${(resumen.total_ventas_efectivo || 0).toFixed(2)}\n` +
        `• Abonos en efectivo: C$${(resumen.total_abonos_efectivo || 0).toFixed(2)}\n` +
        `• Gastos: C$${(resumen.total_gastos || 0).toFixed(2)}\n` +
        `• Efectivo neto esperado: C$${(resumen.efectivo_neto || 0).toFixed(2)}\n` +
        `• Efectivo contado: C$${efectivo.toFixed(2)}\n` +
        (diferencia !== 0 ? 
          `• Diferencia: C$${Math.abs(diferencia).toFixed(2)} ${diferencia > 0 ? '(Sobrante)' : '(Faltante)'}\n` : '') +
        `\n💳 OTROS MÉTODOS:\n` +
        `• Tarjetas: C$${(resumen.total_abonos_tarjeta || 0).toFixed(2)} ` +
        `(${resumen.cantidad_abonos_tarjeta || 0} abonos)\n` +
        `• Transferencias: C$${(resumen.total_abonos_transferencia || 0).toFixed(2)} ` +
        `(${resumen.cantidad_abonos_transferencia || 0} abonos)\n` +
        `\n🗑️ REGISTROS PROCESADOS:\n` +
        `• ${resumen.cantidad_ventas || 0} ventas eliminadas\n` +
        `• ${resumen.cantidad_abonos_efectivo || 0} abonos en efectivo (mantenidos)\n` +
        `• ${resumen.cantidad_gastos || 0} gastos eliminados\n` +
        `• ${resumen.cantidad_abonos_tarjeta || 0} abonos con tarjeta (mantenidos)\n` +
        `• ${resumen.cantidad_abonos_transferencia || 0} abonos con transferencia (mantenidos)`
      
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
      const colorExito = [16, 185, 129] // Verde
      const colorError = [239, 68, 68] // Rojo
      
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

  // Mostrar detalles del arqueo
  const mostrarDetalles = (arqueo) => {
    const diferencia = parseFloat(arqueo.diferencia_efectivo || 0)
    const estadoDiferencia = diferencia > 0 ? '💰 SOBRANTE' : diferencia < 0 ? '📉 FALTANTE' : '✅ EXACTO'
    const colorDiferencia = diferencia > 0 ? '#059669' : diferencia < 0 ? '#dc2626' : '#3b82f6'
    
    const mensaje = `
🎯 **DETALLE COMPLETO DEL ARQUEO**

📅 **FECHA Y HORA**
• ${formatFechaNicaragua(arqueo.fecha)}
• Usuario: ${arqueo.usuario || 'Sistema'}
• ID: ${arqueo.id.substring(0, 8)}...

📊 **RESUMEN FINANCIERO**
• 💰 Ventas Totales: C$${parseFloat(arqueo.total_ventas).toFixed(2)}
• 💳 Ventas Crédito: C$${parseFloat(arqueo.total_credito).toFixed(2)}
• 💵 Efectivo Bruto: C$${parseFloat(arqueo.total_efectivo).toFixed(2)}
• 📉 Gastos: C$${parseFloat(arqueo.total_gastos).toFixed(2)}
• 🏦 Efectivo en Caja: C$${parseFloat(arqueo.efectivo_en_caja).toFixed(2)}

📈 **ANÁLISIS DE DIFERENCIA**
• Diferencia: C$${Math.abs(diferencia).toFixed(2)}
• Estado: <span style="color: ${colorDiferencia}; font-weight: bold;">${estadoDiferencia}</span>
${diferencia !== 0 ? `• Observación: ${diferencia > 0 ? 'Hay más efectivo del esperado' : 'Hay menos efectivo del esperado'}` : ''}

🗂️ **DETALLES OPERATIVOS**
• Ventas eliminadas: ${arqueo.ventas_eliminadas || 0}
• Gastos eliminados: ${arqueo.gastos_eliminados || 0}
• Abonos tarjeta: C$${parseFloat(arqueo.total_abonos_tarjeta || 0).toFixed(2)}
• Abonos transferencia: C$${parseFloat(arqueo.total_abonos_transferencia || 0).toFixed(2)}

📅 **PERÍODO CONTABILIZADO**
• Desde: ${arqueo.periodo_desde || 'No especificado'}
• Hasta: ${arqueo.periodo_hasta || 'No especificado'}

💡 **INFORMACIÓN ADICIONAL**
${diferencia === 0 ? '✅ El arqueo coincide exactamente con lo esperado' : 
  diferencia > 0 ? '💡 Considerar revisión de ingresos no registrados' : 
  '⚠️ Verificar posibles gastos no registrados o errores en cobros'}
    `.trim()
    
    // Crear ventana personalizada
    const ventana = window.open('', '_blank', 'width=600,height=700,scrollbars=yes')
    ventana.document.write(`
      <html>
        <head>
          <title>Detalle de Arqueo - Arelyz Salón</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
              margin: 0;
              padding: 20px;
              color: #1e293b;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 30px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
              max-width: 550px;
              margin: 0 auto;
            }
            .header {
              background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
              color: white;
              padding: 20px;
              border-radius: 10px 10px 0 0;
              margin: -30px -30px 20px -30px;
              text-align: center;
            }
            h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 700;
            }
            .section {
              margin: 25px 0;
              padding: 20px;
              border-radius: 8px;
              background: #f8fafc;
              border-left: 4px solid #8b5cf6;
            }
            .section-title {
              font-size: 16px;
              font-weight: 600;
              color: #475569;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .dato {
              display: flex;
              justify-content: space-between;
              margin: 10px 0;
              padding: 8px 0;
              border-bottom: 1px dashed #e5e7eb;
            }
            .dato:last-child {
              border-bottom: none;
            }
            .label {
              color: #64748b;
              font-weight: 500;
            }
            .valor {
              font-weight: 600;
              color: #1e293b;
            }
            .positivo { color: #059669; }
            .negativo { color: #dc2626; }
            .neutral { color: #3b82f6; }
            .buttons {
              display: flex;
              gap: 10px;
              margin-top: 30px;
              justify-content: center;
            }
            button {
              padding: 12px 24px;
              border: none;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 8px;
              transition: all 0.3s;
            }
            .btn-excel {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
            }
            .btn-pdf {
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              color: white;
            }
            button:hover {
              transform: translateY(-2px);
              box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Detalle de Arqueo</h1>
              <p>Arelyz Salón - Sistema de Caja</p>
            </div>
            
            <div class="section">
              <div class="section-title">📅 FECHA Y HORA</div>
              <div class="dato"><span class="label">Fecha:</span><span class="valor">${formatFechaNicaragua(arqueo.fecha)}</span></div>
              <div class="dato"><span class="label">Usuario:</span><span class="valor">${arqueo.usuario || 'Sistema'}</span></div>
              <div class="dato"><span class="label">ID:</span><span class="valor">${arqueo.id.substring(0, 8)}...</span></div>
            </div>
            
            <div class="section">
              <div class="section-title">📊 RESUMEN FINANCIERO</div>
              <div class="dato"><span class="label">Ventas Totales:</span><span class="valor positivo">C$${parseFloat(arqueo.total_ventas).toFixed(2)}</span></div>
              <div class="dato"><span class="label">Ventas Crédito:</span><span class="valor">C$${parseFloat(arqueo.total_credito).toFixed(2)}</span></div>
              <div class="dato"><span class="label">Efectivo Bruto:</span><span class="valor positivo">C$${parseFloat(arqueo.total_efectivo).toFixed(2)}</span></div>
              <div class="dato"><span class="label">Gastos:</span><span class="valor negativo">C$${parseFloat(arqueo.total_gastos).toFixed(2)}</span></div>
              <div class="dato"><span class="label">Efectivo en Caja:</span><span class="valor ${parseFloat(arqueo.efectivo_en_caja) > 0 ? 'positivo' : 'negativo'}">C$${parseFloat(arqueo.efectivo_en_caja).toFixed(2)}</span></div>
            </div>
            
            <div class="section">
              <div class="section-title">📈 ANÁLISIS DE DIFERENCIA</div>
              <div class="dato"><span class="label">Diferencia:</span><span class="valor ${diferencia > 0 ? 'positivo' : diferencia < 0 ? 'negativo' : 'neutral'}">C$${Math.abs(diferencia).toFixed(2)}</span></div>
              <div class="dato"><span class="label">Estado:</span><span class="valor ${diferencia > 0 ? 'positivo' : diferencia < 0 ? 'negativo' : 'neutral'}">${estadoDiferencia}</span></div>
              ${diferencia !== 0 ? `<div class="dato"><span class="label">Observación:</span><span class="valor">${diferencia > 0 ? 'Hay más efectivo del esperado' : 'Hay menos efectivo del esperado'}</span></div>` : ''}
            </div>
            
            <div class="buttons">
              <button class="btn-excel" onclick="exportExcel()">📊 Exportar Excel</button>
              <button class="btn-pdf" onclick="exportPDF()">📄 Exportar PDF</button>
            </div>
          </div>
          
          <script>
            function exportExcel() {
              window.opener.postMessage({ type: 'exportExcel', id: '${arqueo.id}' }, '*');
              window.close();
            }
            
            function exportPDF() {
              window.opener.postMessage({ type: 'exportPDF', id: '${arqueo.id}' }, '*');
              window.close();
            }
          </script>
        </body>
      </html>
    `)
    ventana.document.close()
    
    // Escuchar mensajes desde la ventana hija
    const handleMessage = (event) => {
      if (event.data.type === 'exportExcel') {
        exportarArqueoExcel(arqueo)
      } else if (event.data.type === 'exportPDF') {
        exportarArqueoPDF(arqueo)
      }
    }
    
    window.addEventListener('message', handleMessage)
    
    // Limpiar el listener cuando se cierre la ventana
    const checkClose = setInterval(() => {
      if (ventana.closed) {
        window.removeEventListener('message', handleMessage)
        clearInterval(checkClose)
      }
    }, 500)
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
                        <span className={`badge-caja ${parseFloat(arqueo.efectivo_en_caja) > 0 ? 'positivo' : 'negativo'}`}>
                          C${parseFloat(arqueo.efectivo_en_caja).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="celda-acciones">
                        <div className="acciones-container">
                          <button 
                            className="btn-accion btn-detalle"
                            onClick={() => mostrarDetalles(arqueo)}
                            title="Ver detalles completos"
                          >
                            <span className="btn-icon">👁️</span>
                            <span className="btn-text">Detalle</span>
                          </button>
                          
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
                    <span className="resumen-label">Abonos con tarjeta:</span>
                    <span className="resumen-valor tarjeta">
                      C${resumenTurno.abonosTarjeta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="resumen-cantidad">({resumenTurno.cantidadAbonosTarjeta} abonos) 💳</span>
                  </div>
                  
                  <div className="resumen-item">
                    <span className="resumen-label">Abonos con transferencia:</span>
                    <span className="resumen-valor transferencia">
                      C${resumenTurno.abonosTransferencia.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="resumen-cantidad">({resumenTurno.cantidadAbonosTransferencia} abonos) 📤</span>
                  </div>
                  
                  <div className="resumen-item">
                    <span className="resumen-label">Ventas a crédito:</span>
                    <span className="resumen-valor credito">
                      C${resumenTurno.totalCreditos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="resumen-cantidad">({resumenTurno.cantidadCreditos} créditos) 🔒</span>
                  </div>
                  
                  <div className="resumen-total">
                    <span className="total-label">TOTAL INGRESOS:</span>
                    <span className="total-valor">
                      C${(resumenTurno.totalVentas + resumenTurno.totalCreditos + 
                          resumenTurno.totalAbonosEfectivo + 
                          resumenTurno.abonosTarjeta + 
                          resumenTurno.abonosTransferencia).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
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
                    <h5 className="calculo-titulo">CÁLCULO DE EFECTIVO</h5>
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
                      <li><span className="eliminar-item">{resumenTurno.cantidadVentas} ventas en efectivo</span></li>
                      <li><span className="eliminar-item">{resumenTurno.cantidadGastos} gastos</span></li>
                    </ul>
                  </div>
                  <div className="advertencia-col">
                    <p className="advertencia-subtitulo">✅ MANTENIDOS:</p>
                    <ul className="advertencia-lista">
                      <li><span className="mantener-item">{resumenTurno.cantidadAbonosEfectivo} abonos en efectivo</span></li>
                      <li><span className="mantener-item">{resumenTurno.cantidadAbonosTarjeta} abonos con tarjeta</span></li>
                      <li><span className="mantener-item">{resumenTurno.cantidadAbonosTransferencia} abonos con transferencia</span></li>
                      <li><span className="mantener-item">{resumenTurno.cantidadCreditos} créditos activos</span></li>
                    </ul>
                  </div>
                </div>
                
                <div className="advertencia-footer">
                  <p className="advertencia-nota">
                    💾 <strong>Nota:</strong> Todo el historial se guardará en la tabla "facturados" para consultas futuras.
                    Los abonos y créditos permanecen en el sistema para seguimiento.
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