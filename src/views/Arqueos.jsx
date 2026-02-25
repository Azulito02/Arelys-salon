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
    
    const [ventasResp, creditosResp, abonosResp, gastosResp] = await Promise.all([
      supabase.from('ventas').select('*').gte('fecha', fechaDesde.toISOString()),
      supabase.from('ventas_credito').select('*').gte('fecha', fechaDesde.toISOString()),
      supabase.from('abonos_credito').select('*')
        .gte('fecha', fechaDesde.toISOString())
        .is('procesado_en_arqueo', false),
      supabase.from('gastos').select('*')
        .gte('fecha', fechaDesde.toISOString())
        .eq('procesado_en_arqueo', false)
    ])
    
    const ventas = ventasResp.data || []
    const creditos = creditosResp.data || []
    const abonos = abonosResp.data || []
    const gastos = gastosResp.data || []

    console.log('📊 Ventas pendientes:', ventas.length)
    console.log('📊 Abonos pendientes:', abonos.length)
    console.log('📊 Gastos pendientes:', gastos.length)
    
    // ============ CALCULAR VENTAS POR MÉTODO DE PAGO ============
    let totalVentasEfectivo = 0
    let totalVentasTarjeta = 0
    let totalVentasTransferencia = 0
    
    let cantidadVentasEfectivo = 0
    let cantidadVentasTarjeta = 0
    let cantidadVentasTransferencia = 0
    
    // CORREGIDO: Procesar ventas incluyendo mixtas
    ventas.forEach(venta => {
      const metodo = venta.metodo_pago?.toLowerCase() || ''
      
      // Ventas simples
      if (metodo === 'efectivo') {
        totalVentasEfectivo += parseFloat(venta.total) || 0
        cantidadVentasEfectivo++
      }
      else if (metodo === 'tarjeta') {
        totalVentasTarjeta += parseFloat(venta.total) || 0
        cantidadVentasTarjeta++
      }
      else if (metodo === 'transferencia') {
        totalVentasTransferencia += parseFloat(venta.total) || 0
        cantidadVentasTransferencia++
      }
      // Ventas mixtas - ¡CORREGIDO!
      else if (metodo === 'mixto') {
        const efectivo = parseFloat(venta.efectivo) || 0
        const tarjeta = parseFloat(venta.tarjeta) || 0
        const transferencia = parseFloat(venta.transferencia) || 0
        
        totalVentasEfectivo += efectivo
        totalVentasTarjeta += tarjeta
        totalVentasTransferencia += transferencia
        
        // Incrementar contadores SOLO si tienen monto
        if (efectivo > 0) cantidadVentasEfectivo++
        if (tarjeta > 0) cantidadVentasTarjeta++
        if (transferencia > 0) cantidadVentasTransferencia++
        
        console.log('🎯 Venta mixta procesada:', { efectivo, tarjeta, transferencia })
      }
      else {
        console.log('Método de pago desconocido:', venta.metodo_pago)
      }
    })
    
    // ============ CALCULAR ABONOS POR MÉTODO DE PAGO ============
    let abonosEfectivo = 0
    let abonosTarjeta = 0
    let abonosTransferencia = 0
    
    let cantidadAbonosEfectivo = 0
    let cantidadAbonosTarjeta = 0
    let cantidadAbonosTransferencia = 0
    
    // CORREGIDO: Procesar abonos incluyendo mixtos
    abonos.forEach(abono => {
      const metodo = abono.metodo_pago?.toLowerCase() || ''
      
      // Abonos simples
      if (metodo === 'efectivo') {
        abonosEfectivo += parseFloat(abono.monto) || 0
        cantidadAbonosEfectivo++
      }
      else if (metodo === 'tarjeta') {
        abonosTarjeta += parseFloat(abono.monto) || 0
        cantidadAbonosTarjeta++
      }
      else if (metodo === 'transferencia') {
        abonosTransferencia += parseFloat(abono.monto) || 0
        cantidadAbonosTransferencia++
      }
      // Abonos mixtos - ¡CORREGIDO!
      else if (metodo === 'mixto') {
        const efectivo = parseFloat(abono.efectivo) || 0
        const tarjeta = parseFloat(abono.tarjeta) || 0
        const transferencia = parseFloat(abono.transferencia) || 0
        
        abonosEfectivo += efectivo
        abonosTarjeta += tarjeta
        abonosTransferencia += transferencia
        
        // Incrementar contadores SOLO si tienen monto
        if (efectivo > 0) cantidadAbonosEfectivo++
        if (tarjeta > 0) cantidadAbonosTarjeta++
        if (transferencia > 0) cantidadAbonosTransferencia++
        
        console.log('🎯 Abono mixto procesado:', { efectivo, tarjeta, transferencia })
      }
    })
    
    const totalCreditos = creditos.reduce((s, c) => s + (parseFloat(c.total) || 0), 0)
    const totalGastos = gastos.reduce((s, g) => s + (parseFloat(g.monto) || 0), 0)
    
    console.log('📊 Totales después de procesar:', {
      ventas: {
        efectivo: { monto: totalVentasEfectivo, cant: cantidadVentasEfectivo },
        tarjeta: { monto: totalVentasTarjeta, cant: cantidadVentasTarjeta },
        transferencia: { monto: totalVentasTransferencia, cant: cantidadVentasTransferencia }
      },
      abonos: {
        efectivo: { monto: abonosEfectivo, cant: cantidadAbonosEfectivo },
        tarjeta: { monto: abonosTarjeta, cant: cantidadAbonosTarjeta },
        transferencia: { monto: abonosTransferencia, cant: cantidadAbonosTransferencia }
      },
      creditos: { monto: totalCreditos, cant: creditos.length },
      gastos: { monto: totalGastos, cant: gastos.length }
    })
    
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
      
      // Cantidades CORREGIDAS - cada método tiene su propio contador
      cantidadVentas: ventas.length,
      cantidadVentasEfectivo,
      cantidadVentasTarjeta,
      cantidadVentasTransferencia,
      
      cantidadCreditos: creditos.length,
      
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
    
    // Mensaje de confirmación CORREGIDO
    const mensajeConfirmacion = 
      `¿CONFIRMAR ARQUEO DE TURNO?\n\n` +
      `📊 RESUMEN DEL DÍA COMPLETO:\n` +
      `• Ventas en efectivo: C$${resumenTurno?.totalVentasEfectivo.toFixed(2)} ` +
      `(${resumenTurno?.cantidadVentasEfectivo} ventas)\n` +
      `• Ventas con tarjeta: C$${resumenTurno?.totalVentasTarjeta.toFixed(2)} ` +
      `(${resumenTurno?.cantidadVentasTarjeta} ventas)\n` +
      `• Ventas con transferencia: C$${resumenTurno?.totalVentasTransferencia.toFixed(2)} ` +
      `(${resumenTurno?.cantidadVentasTransferencia} ventas)\n` +
      `• Abonos en efectivo: C$${resumenTurno?.totalAbonosEfectivo.toFixed(2)} ` +
      `(${resumenTurno?.cantidadAbonosEfectivo} abonos)\n` +
      `• Abonos con tarjeta: C$${resumenTurno?.abonosTarjeta.toFixed(2)} ` +
      `(${resumenTurno?.cantidadAbonosTarjeta} abonos)\n` +
      `• Abonos con transferencia: C$${resumenTurno?.abonosTransferencia.toFixed(2)} ` +
      `(${resumenTurno?.cantidadAbonosTransferencia} abonos)\n` +
      `• Gastos: C$${resumenTurno?.totalGastos.toFixed(2)} ` +
      `(${resumenTurno?.cantidadGastos} gastos)\n` +
      `• Créditos: C$${resumenTurno?.totalCreditos.toFixed(2)} ` +
      `(${resumenTurno?.cantidadCreditos} créditos)\n` +
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

// Exportar UN arqueo a Excel - VERSIÓN CORREGIDA
const exportarArqueoExcel = async (arqueo) => {
  try {
    setExportando(prev => ({ ...prev, [arqueo.id]: 'excel' }))
    
    const { data: arqueoCompleto, error } = await supabase
      .from('arqueos')
      .select('*')
      .eq('id', arqueo.id)
      .single()
    
    if (error) throw error
    
    // Hoja 1: Resumen General
    const resumenGeneral = [{
      'FECHA': formatFechaNicaragua(arqueoCompleto.fecha),
      'USUARIO': arqueoCompleto.usuario || 'Sistema',
      'PERÍODO DESDE': arqueoCompleto.periodo_desde || '',
      'PERÍODO HASTA': arqueoCompleto.periodo_hasta || '',
      'EFECTIVO EN CAJA': `C$${parseFloat(arqueoCompleto.efectivo_en_caja || 0).toFixed(2)}`,
      'DIFERENCIA': `C$${Math.abs(parseFloat(arqueoCompleto.diferencia_efectivo || 0)).toFixed(2)} ${parseFloat(arqueoCompleto.diferencia_efectivo || 0) > 0 ? 'Sobrante' : parseFloat(arqueoCompleto.diferencia_efectivo || 0) < 0 ? 'Faltante' : 'Exacto'}`,
    }]
    
    // Hoja 2: Ventas por método
    const ventasMetodo = [
      { 'MÉTODO': 'EFECTIVO', 'MONTO': `C$${parseFloat(arqueoCompleto.total_ventas_efectivo || 0).toFixed(2)}`, 'CANTIDAD': arqueoCompleto.ventas_eliminadas || 0 },
      { 'MÉTODO': 'TARJETA', 'MONTO': `C$${parseFloat(arqueoCompleto.total_ventas_tarjeta || 0).toFixed(2)}`, 'CANTIDAD': 'N/A' },
      { 'MÉTODO': 'TRANSFERENCIA', 'MONTO': `C$${parseFloat(arqueoCompleto.total_ventas_transferencia || 0).toFixed(2)}`, 'CANTIDAD': 'N/A' },
      { 'MÉTODO': 'CRÉDITO', 'MONTO': `C$${parseFloat(arqueoCompleto.total_credito || 0).toFixed(2)}`, 'CANTIDAD': arqueoCompleto.creditos_completados_eliminados || 0 },
      { 'MÉTODO': 'TOTAL VENTAS', 'MONTO': `C$${parseFloat(arqueoCompleto.total_ventas || 0).toFixed(2)}`, 'CANTIDAD': '' }
    ]
    
    // Hoja 3: Abonos por método
    const abonosMetodo = [
      { 'MÉTODO': 'EFECTIVO', 'MONTO': `C$${parseFloat(arqueoCompleto.total_abonos_efectivo || 0).toFixed(2)}`, 'CANTIDAD': arqueoCompleto.abonos_efectivo_eliminados || 0 },
      { 'MÉTODO': 'TARJETA', 'MONTO': `C$${parseFloat(arqueoCompleto.total_abonos_tarjeta || 0).toFixed(2)}`, 'CANTIDAD': arqueoCompleto.abonos_tarjeta_eliminados || 0 },
      { 'MÉTODO': 'TRANSFERENCIA', 'MONTO': `C$${parseFloat(arqueoCompleto.total_abonos_transferencia || 0).toFixed(2)}`, 'CANTIDAD': arqueoCompleto.abonos_transferencia_eliminados || 0 },
      { 'MÉTODO': 'TOTAL ABONOS', 'MONTO': `C$${(parseFloat(arqueoCompleto.total_abonos_efectivo || 0) + parseFloat(arqueoCompleto.total_abonos_tarjeta || 0) + parseFloat(arqueoCompleto.total_abonos_transferencia || 0)).toFixed(2)}`, 'CANTIDAD': (arqueoCompleto.abonos_efectivo_eliminados || 0) + (arqueoCompleto.abonos_tarjeta_eliminados || 0) + (arqueoCompleto.abonos_transferencia_eliminados || 0) }
    ]
    
    // Hoja 4: Gastos
    const gastos = [
      { 'DESCRIPCIÓN': 'Total Gastos', 'MONTO': `C$${parseFloat(arqueoCompleto.total_gastos || 0).toFixed(2)}`, 'CANTIDAD': arqueoCompleto.gastos_eliminados || 0 }
    ]
    
    // Hoja 5: Cálculo de efectivo
    const calculoEfectivo = [
      { 'CONCEPTO': 'Ventas en efectivo', 'MONTO': `C$${parseFloat(arqueoCompleto.total_ventas_efectivo || 0).toFixed(2)}` },
      { 'CONCEPTO': '+ Abonos en efectivo', 'MONTO': `C$${parseFloat(arqueoCompleto.total_abonos_efectivo || 0).toFixed(2)}` },
      { 'CONCEPTO': '= EFECTIVO BRUTO', 'MONTO': `C$${parseFloat(arqueoCompleto.total_efectivo || 0).toFixed(2)}` },
      { 'CONCEPTO': '- Gastos', 'MONTO': `C$${parseFloat(arqueoCompleto.total_gastos || 0).toFixed(2)}` },
      { 'CONCEPTO': '= EFECTIVO NETO ESPERADO', 'MONTO': `C$${(parseFloat(arqueoCompleto.total_efectivo || 0) - parseFloat(arqueoCompleto.total_gastos || 0)).toFixed(2)}` },
      { 'CONCEPTO': 'EFECTIVO CONTADO', 'MONTO': `C$${parseFloat(arqueoCompleto.efectivo_en_caja || 0).toFixed(2)}` },
      { 'CONCEPTO': 'DIFERENCIA', 'MONTO': `C$${Math.abs(parseFloat(arqueoCompleto.diferencia_efectivo || 0)).toFixed(2)} ${parseFloat(arqueoCompleto.diferencia_efectivo || 0) > 0 ? 'Sobrante' : parseFloat(arqueoCompleto.diferencia_efectivo || 0) < 0 ? 'Faltante' : 'Exacto'}` }
    ]
    
    const wb = XLSX.utils.book_new()
    
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumenGeneral), 'Resumen')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ventasMetodo), 'Ventas')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(abonosMetodo), 'Abonos')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(gastos), 'Gastos')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(calculoEfectivo), 'Cálculo Efectivo')
    
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
  // Exportar UN arqueo a PDF - VERSIÓN CORREGIDA
const exportarArqueoPDF = async (arqueo) => {
  try {
    setExportando(prev => ({ ...prev, [arqueo.id]: 'pdf' }))
    
    const { data: arqueoCompleto, error } = await supabase
      .from('arqueos')
      .select('*')
      .eq('id', arqueo.id)
      .single()
    
    if (error) throw error
    
    const doc = new jsPDF()
    const fecha = formatFechaNicaragua(arqueoCompleto.fecha)
    const fechaArchivo = fecha.replace(/[/: ]/g, '-').replace(/[a.m.p.m]/g, '')
    
    const colorPrimario = [139, 92, 246]
    const colorSecundario = [59, 130, 246]
    
    // ============ PÁGINA 1 ============
    doc.setFontSize(20)
    doc.setTextColor(...colorPrimario)
    doc.text('COMPROBANTE DE ARQUEO', 105, 20, { align: 'center' })
    
    doc.setFontSize(12)
    doc.setTextColor(100, 116, 139)
    doc.text('Arelyz Salón - Sistema de Caja', 105, 30, { align: 'center' })
    
    doc.setDrawColor(...colorPrimario)
    doc.setLineWidth(0.5)
    doc.line(20, 35, 190, 35)
    
    doc.setFontSize(14)
    doc.setTextColor(30, 41, 59)
    doc.text(`Fecha: ${fecha}`, 20, 45)
    doc.text(`Usuario: ${arqueoCompleto.usuario || 'Sistema'}`, 20, 55)
    
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text(`ID: ${arqueoCompleto.id.substring(0, 8)}...`, 150, 45)
    doc.text(`Período: ${arqueoCompleto.periodo_desde || 'N/A'}`, 150, 55)
    doc.text(`Hasta: ${arqueoCompleto.periodo_hasta || 'N/A'}`, 150, 62)
    
    // ============ EFECTIVO ============
    doc.setFontSize(16)
    doc.setTextColor(...colorSecundario)
    doc.text('EFECTIVO EN CAJA - DETALLADO', 20, 80)
    
    doc.setFillColor(248, 250, 252)
    doc.rect(20, 85, 170, 60, 'F')
    
    doc.setFontSize(11)
    doc.setTextColor(30, 41, 59)
    
    // Ventas en efectivo
    doc.text('Ventas en efectivo:', 25, 95)
    doc.setFont(undefined, 'bold')
    doc.text(`C$${parseFloat(arqueoCompleto.total_ventas_efectivo || 0).toFixed(2)}`, 100, 95)
    doc.setFont(undefined, 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text(`(${arqueoCompleto.ventas_eliminadas || 0} ventas)`, 130, 95)
    
    // Abonos en efectivo
    doc.setFontSize(11)
    doc.setTextColor(30, 41, 59)
    doc.text('Abonos en efectivo:', 25, 105)
    doc.setFont(undefined, 'bold')
    doc.text(`C$${parseFloat(arqueoCompleto.total_abonos_efectivo || 0).toFixed(2)}`, 100, 105)
    doc.setFont(undefined, 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text(`(${arqueoCompleto.abonos_efectivo_eliminados || 0} abonos)`, 130, 105)
    
    doc.setDrawColor(200, 200, 200)
    doc.line(25, 112, 185, 112)
    
    // EFECTIVO BRUTO
    doc.setFontSize(12)
    doc.setTextColor(...colorPrimario)
    doc.setFont(undefined, 'bold')
    doc.text('EFECTIVO BRUTO:', 25, 122)
    doc.text(`C$${parseFloat(arqueoCompleto.total_efectivo || 0).toFixed(2)}`, 100, 122)
    
    // Gastos
    doc.setFontSize(11)
    doc.setTextColor(239, 68, 68)
    doc.setFont(undefined, 'normal')
    doc.text('Gastos:', 25, 132)
    doc.setFont(undefined, 'bold')
    doc.text(`-C$${parseFloat(arqueoCompleto.total_gastos || 0).toFixed(2)}`, 100, 132)
    doc.setFont(undefined, 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text(`(${arqueoCompleto.gastos_eliminados || 0} gastos)`, 130, 132)
    
    doc.setDrawColor(...colorSecundario)
    doc.setLineWidth(1)
    doc.line(25, 138, 185, 138)
    
    // EFECTIVO NETO
    doc.setFontSize(14)
    doc.setTextColor(16, 185, 129)
    doc.setFont(undefined, 'bold')
    doc.text('EFECTIVO NETO EN CAJA:', 25, 150)
    doc.text(`C$${parseFloat(arqueoCompleto.efectivo_en_caja || 0).toFixed(2)}`, 130, 150)
    
    // Diferencia
    const efectivoNetoCalculado = (parseFloat(arqueoCompleto.total_efectivo || 0) - parseFloat(arqueoCompleto.total_gastos || 0))
    const diferencia = parseFloat(arqueoCompleto.efectivo_en_caja || 0) - efectivoNetoCalculado
    
    if (Math.abs(diferencia) > 0.01) {
      doc.setFontSize(11)
      doc.setTextColor(diferencia > 0 ? 16 : 239, diferencia > 0 ? 185 : 68, diferencia > 0 ? 129 : 68)
      doc.text(`Diferencia: C$${Math.abs(diferencia).toFixed(2)} ${diferencia > 0 ? '(Sobrante)' : '(Faltante)'}`, 25, 162)
    }
    
    // ============ OTROS MÉTODOS ============
    doc.setFontSize(16)
    doc.setTextColor(...colorSecundario)
    doc.text('OTROS MÉTODOS DE PAGO', 20, 185)
    
    // Cabecera
    doc.setFillColor(243, 244, 246)
    doc.rect(20, 190, 170, 8, 'F')
    doc.setFontSize(10)
    doc.setTextColor(55, 65, 81)
    doc.setFont(undefined, 'bold')
    doc.text('Método', 25, 196)
    doc.text('Ventas', 80, 196)
    doc.text('Abonos', 130, 196)
    
    doc.setFont(undefined, 'normal')
    doc.setTextColor(30, 41, 59)
    
    // Tarjeta
    doc.text('Tarjeta', 25, 206)
    doc.text(`C$${parseFloat(arqueoCompleto.total_ventas_tarjeta || 0).toFixed(2)}`, 80, 206)
    doc.text(`C$${parseFloat(arqueoCompleto.total_abonos_tarjeta || 0).toFixed(2)}`, 130, 206)
    
    // Transferencia
    doc.text('Transferencia', 25, 216)
    doc.text(`C$${parseFloat(arqueoCompleto.total_ventas_transferencia || 0).toFixed(2)}`, 80, 216)
    doc.text(`C$${parseFloat(arqueoCompleto.total_abonos_transferencia || 0).toFixed(2)}`, 130, 216)
    
    // Crédito
    doc.text('Crédito (ventas)', 25, 226)
    doc.text(`C$${parseFloat(arqueoCompleto.total_credito || 0).toFixed(2)}`, 80, 226)
    doc.text('-', 130, 226)
    
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text(`Total ventas crédito: ${arqueoCompleto.creditos_completados_eliminados || 0} créditos`, 25, 236)
    
    // ============ PÁGINA 2 ============
    doc.addPage()
    
    doc.setFontSize(16)
    doc.setTextColor(...colorSecundario)
    doc.text('REGISTROS DEL ARQUEO', 20, 20)
    
    // Ventas eliminadas
    doc.setFillColor(254, 226, 226)
    doc.rect(20, 30, 80, 25, 'F')
    doc.setTextColor(153, 27, 27)
    doc.setFontSize(20)
    doc.setFont(undefined, 'bold')
    doc.text(`${arqueoCompleto.ventas_eliminadas || 0}`, 60, 48, { align: 'center' })
    doc.setFontSize(10)
    doc.text('VENTAS', 60, 55, { align: 'center' })
    doc.text('ELIMINADAS', 60, 61, { align: 'center' })
    
    // Gastos eliminados
    doc.setFillColor(254, 226, 226)
    doc.rect(110, 30, 80, 25, 'F')
    doc.setTextColor(153, 27, 27)
    doc.setFontSize(20)
    doc.setFont(undefined, 'bold')
    doc.text(`${arqueoCompleto.gastos_eliminados || 0}`, 150, 48, { align: 'center' })
    doc.setFontSize(10)
    doc.text('GASTOS', 150, 55, { align: 'center' })
    doc.text('ELIMINADOS', 150, 61, { align: 'center' })
    
    // Abonos procesados
    const totalAbonos = (arqueoCompleto.abonos_efectivo_eliminados || 0) + 
                       (arqueoCompleto.abonos_tarjeta_eliminados || 0) + 
                       (arqueoCompleto.abonos_transferencia_eliminados || 0)
    
    doc.setFillColor(209, 250, 229)
    doc.rect(65, 70, 80, 25, 'F')
    doc.setTextColor(6, 95, 70)
    doc.setFontSize(20)
    doc.setFont(undefined, 'bold')
    doc.text(`${totalAbonos}`, 105, 88, { align: 'center' })
    doc.setFontSize(10)
    doc.text('ABONOS', 105, 95, { align: 'center' })
    doc.text('PROCESADOS', 105, 101, { align: 'center' })
    
    // Detalle de abonos
    doc.setFontSize(12)
    doc.setTextColor(30, 41, 59)
    doc.text('Detalle de abonos procesados:', 20, 120)
    
    doc.setFontSize(10)
    doc.text(`• Efectivo: ${arqueoCompleto.abonos_efectivo_eliminados || 0} abonos - C$${parseFloat(arqueoCompleto.total_abonos_efectivo || 0).toFixed(2)}`, 25, 130)
    doc.text(`• Tarjeta: ${arqueoCompleto.abonos_tarjeta_eliminados || 0} abonos - C$${parseFloat(arqueoCompleto.total_abonos_tarjeta || 0).toFixed(2)}`, 25, 140)
    doc.text(`• Transferencia: ${arqueoCompleto.abonos_transferencia_eliminados || 0} abonos - C$${parseFloat(arqueoCompleto.total_abonos_transferencia || 0).toFixed(2)}`, 25, 150)
    
    // Créditos
    doc.text(`• Ventas a crédito: ${arqueoCompleto.creditos_completados_eliminados || 0} créditos - C$${parseFloat(arqueoCompleto.total_credito || 0).toFixed(2)}`, 25, 165)
    
    // Nota
    doc.setFillColor(254, 243, 199)
    doc.rect(20, 180, 170, 35, 'F')
    doc.setTextColor(146, 64, 14)
    doc.setFontSize(10)
    doc.text('NOTA IMPORTANTE:', 25, 190)
    doc.setFontSize(9)
    doc.text('Los abonos se contabilizan UNA SOLA VEZ en este arqueo', 25, 200)
    doc.text('y se marcan como procesados para evitar doble conteo.', 25, 207)
    doc.text('Los créditos se mantienen en el sistema para seguimiento.', 25, 214)
    
    // Pie
    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text('Documento generado automáticamente por el Sistema Arelyz Salón', 105, pageHeight - 10, { align: 'center' })
    
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
                C${(resumenTurno.totalVentasEfectivo || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
              <span className="resumen-cantidad">({resumenTurno.cantidadVentasEfectivo || 0} ventas)</span>
            </div>
            
            <div className="resumen-item">
              <span className="resumen-label">Abonos en efectivo:</span>
              <span className="resumen-valor positivo">
                C${(resumenTurno.totalAbonosEfectivo || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
              <span className="resumen-cantidad">({resumenTurno.cantidadAbonosEfectivo || 0} abonos)</span>
            </div>
            
            <h4 className="resumen-subtitulo" style={{marginTop: '20px'}}>💳 OTROS MÉTODOS</h4>
            
            <div className="resumen-item">
              <span className="resumen-label">Ventas con tarjeta:</span>
              <span className="resumen-valor tarjeta">
                C${(resumenTurno.totalVentasTarjeta || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
              <span className="resumen-cantidad">({resumenTurno.cantidadVentasTarjeta || 0} ventas)</span>
            </div>
            
            <div className="resumen-item">
              <span className="resumen-label">Ventas con transferencia:</span>
              <span className="resumen-valor transferencia">
                C${(resumenTurno.totalVentasTransferencia || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
              <span className="resumen-cantidad">({resumenTurno.cantidadVentasTransferencia || 0} ventas)</span>
            </div>
            
            <div className="resumen-item">
              <span className="resumen-label">Abonos con tarjeta:</span>
              <span className="resumen-valor tarjeta">
                C${(resumenTurno.abonosTarjeta || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
              <span className="resumen-cantidad">({resumenTurno.cantidadAbonosTarjeta || 0} abonos)</span>
            </div>
            
            <div className="resumen-item">
              <span className="resumen-label">Abonos con transferencia:</span>
              <span className="resumen-valor transferencia">
                C${(resumenTurno.abonosTransferencia || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
              <span className="resumen-cantidad">({resumenTurno.cantidadAbonosTransferencia || 0} abonos)</span>
            </div>
            
            <div className="resumen-item">
              <span className="resumen-label">Ventas a crédito:</span>
              <span className="resumen-valor credito">
                C${(resumenTurno.totalCreditos || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
              <span className="resumen-cantidad">({resumenTurno.cantidadCreditos || 0} créditos)</span>
            </div>
          </div>
          
          {/* Columna derecha - Egresos y cálculo de efectivo */}
          <div className="resumen-columna egresos-col">
            <h4 className="resumen-subtitulo">📉 EGRESOS</h4>
            
            <div className="resumen-item">
              <span className="resumen-label">Gastos:</span>
              <span className="resumen-valor negativo">
                C${(resumenTurno.totalGastos || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
              <span className="resumen-cantidad">({resumenTurno.cantidadGastos || 0} gastos)</span>
            </div>
            
            <div className="resumen-separador"></div>
            
            <div className="resumen-calculo">
              <h5 className="calculo-titulo">💰 CÁLCULO DE EFECTIVO PARA CAJA</h5>
              <div className="calculo-item">
                <span>Ventas en efectivo:</span>
                <span>C${(resumenTurno.totalVentasEfectivo || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="calculo-item">
                <span>+ Abonos en efectivo:</span>
                <span>C${(resumenTurno.totalAbonosEfectivo || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="calculo-subtotal">
                <span>EFECTIVO BRUTO:</span>
                <span className="subtotal-valor">
                  C${(resumenTurno.totalEfectivo || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="calculo-item">
                <span>- Gastos:</span>
                <span>C${(resumenTurno.totalGastos || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="calculo-total">
                <span>EFECTIVO NETO ESPERADO:</span>
                <span className="neto-esperado">
                  C${(resumenTurno.efectivoNeto || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
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
                  <span className={`diferencia-valor ${(parseFloat(efectivoContado) - (resumenTurno.efectivoNeto || 0)) >= 0 ? 'positivo' : 'negativo'}`}>
                    C${Math.abs(parseFloat(efectivoContado) - (resumenTurno.efectivoNeto || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    {(parseFloat(efectivoContado) - (resumenTurno.efectivoNeto || 0)) > 0 ? ' (Sobrante)' : ' (Faltante)'}
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
                <li><span className="eliminar-item">{resumenTurno.cantidadVentas || 0} ventas</span></li>
                <li><span className="eliminar-item">{resumenTurno.cantidadGastos || 0} gastos</span></li>
              </ul>
            </div>
            <div className="advertencia-col">
              <p className="advertencia-subtitulo">✅ PROCESADOS:</p>
              <ul className="advertencia-lista">
                <li><span className="mantener-item">{resumenTurno.cantidadAbonosEfectivo || 0} abonos en efectivo</span></li>
                <li><span className="mantener-item">{resumenTurno.cantidadAbonosTarjeta || 0} abonos con tarjeta</span></li>
                <li><span className="mantener-item">{resumenTurno.cantidadAbonosTransferencia || 0} abonos con transferencia</span></li>
                <li><span className="mantener-item">{resumenTurno.cantidadCreditos || 0} créditos (mantenidos)</span></li>
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