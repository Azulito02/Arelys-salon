// src/views/Inversiones.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../database/supabase'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import './Inversiones.css'

const Inversiones = () => {
  const [inversiones, setInversiones] = useState([])
  const [inversionesFiltradas, setInversionesFiltradas] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  
  // Filtros
  const [filtroTipoMonto, setFiltroTipoMonto] = useState('todos')
  const [filtroBanco, setFiltroBanco] = useState('todos')
  const [filtroBusqueda, setFiltroBusqueda] = useState('')
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('')
  const [filtroFechaFin, setFiltroFechaFin] = useState('')
  
  // Formulario nueva inversión
  const [nuevaInversion, setNuevaInversion] = useState({
    nombre: '',
    monto: '',
    tipo_monto: 'efectivo',
    banco: '',
    fecha: '' // ✅ Agregamos campo fecha
  })
  
  const [exportando, setExportando] = useState(false)
  
  // Resumen
  const [resumen, setResumen] = useState({
    totalInversiones: 0,
    totalMonto: 0,
    totalTransferencia: 0,
    totalTarjeta: 0,
    totalEfectivo: 0,
    porBanco: {}
  })

  useEffect(() => {
    cargarInversiones()
  }, [])

  useEffect(() => {
    aplicarFiltros()
  }, [inversiones, filtroTipoMonto, filtroBanco, filtroBusqueda, filtroFechaInicio, filtroFechaFin])

  const cargarInversiones = async () => {
    try {
      setLoading(true)
      
      // Cargar TODAS las inversiones por lotes (evita el límite de 1000 filas de Supabase)
      let data = []
      let desde = 0
      const tamanoLote = 1000
      let sigueHabiendoDatos = true

      while (sigueHabiendoDatos) {
        const { data: lote, error } = await supabase
          .from('inversiones')
          .select('*')
          .order('fecha', { ascending: false })
          .range(desde, desde + tamanoLote - 1)

        if (error) throw error

        if (lote && lote.length > 0) {
          data = [...data, ...lote]
          desde += tamanoLote
          sigueHabiendoDatos = lote.length === tamanoLote
        } else {
          sigueHabiendoDatos = false
        }
      }

      const inversionesProcesadas = (data || []).map(inv => ({
        ...inv,
        fecha_formateada: formatFechaNicaragua(inv.fecha),
        banco_nombre: getBancoNombre(inv.banco),
        tipo_monto_nombre: getTipoMontoNombre(inv.tipo_monto)
      }))

      setInversiones(inversionesProcesadas)
    } catch (error) {
      console.error('Error cargando inversiones:', error)
      alert('Error al cargar las inversiones')
    } finally {
      setLoading(false)
    }
  }
  const aplicarFiltros = () => {
    let filtradas = [...inversiones]
    
    if (filtroTipoMonto !== 'todos') {
      filtradas = filtradas.filter(f => f.tipo_monto === filtroTipoMonto)
    }
    
    if (filtroBanco !== 'todos') {
      filtradas = filtradas.filter(f => f.banco === filtroBanco)
    }
    
    if (filtroBusqueda.trim() !== '') {
      const termino = filtroBusqueda.toLowerCase()
      filtradas = filtradas.filter(f => 
        f.nombre.toLowerCase().includes(termino) ||
        (f.banco_nombre && f.banco_nombre.toLowerCase().includes(termino))
      )
    }
    
    if (filtroFechaInicio) {
      const fechaInicio = new Date(filtroFechaInicio)
      fechaInicio.setHours(0, 0, 0, 0)
      filtradas = filtradas.filter(f => new Date(f.fecha) >= fechaInicio)
    }
    
    if (filtroFechaFin) {
      const fechaFin = new Date(filtroFechaFin)
      fechaFin.setHours(23, 59, 59, 999)
      filtradas = filtradas.filter(f => new Date(f.fecha) <= fechaFin)
    }
    
    setInversionesFiltradas(filtradas)
    calcularResumen(filtradas)
  }

  const calcularResumen = (inversionesData) => {
    let totalMonto = 0
    let totalTransferencia = 0
    let totalTarjeta = 0
    let totalEfectivo = 0
    let porBanco = {}
    
    const bancos = ['ficohsa', 'lafise', 'banpro', 'avanz', 'bac', 'bdf']
    bancos.forEach(banco => {
      porBanco[banco] = { monto: 0, cantidad: 0 }
    })
    porBanco['efectivo'] = { monto: 0, cantidad: 0 }
    porBanco['sin_banco'] = { monto: 0, cantidad: 0 }
    
    inversionesData.forEach(inv => {
      const monto = parseFloat(inv.monto || 0)
      totalMonto += monto
      
      if (inv.tipo_monto === 'transferencia') {
        totalTransferencia += monto
      } else if (inv.tipo_monto === 'tarjeta') {
        totalTarjeta += monto
      } else if (inv.tipo_monto === 'efectivo') {
        totalEfectivo += monto
      }
      
      if (inv.tipo_monto === 'efectivo') {
        porBanco['efectivo'].monto += monto
        porBanco['efectivo'].cantidad++
      } else if (inv.banco && porBanco[inv.banco]) {
        porBanco[inv.banco].monto += monto
        porBanco[inv.banco].cantidad++
      } else {
        porBanco['sin_banco'].monto += monto
        porBanco['sin_banco'].cantidad++
      }
    })
    
    setResumen({
      totalInversiones: inversionesData.length,
      totalMonto,
      totalTransferencia,
      totalTarjeta,
      totalEfectivo,
      porBanco
    })
  }

  // ✅ Función para obtener fecha y hora local actual en formato para input datetime-local
  const getFechaHoraLocal = () => {
    const ahora = new Date()
    const año = ahora.getFullYear()
    const mes = String(ahora.getMonth() + 1).padStart(2, '0')
    const dia = String(ahora.getDate()).padStart(2, '0')
    const horas = String(ahora.getHours()).padStart(2, '0')
    const minutos = String(ahora.getMinutes()).padStart(2, '0')
    return `${año}-${mes}-${dia}T${horas}:${minutos}`
  }

  // ✅ Función para formatear fecha a ISO para guardar en Supabase
  const formatearFechaParaGuardar = (fechaLocal) => {
    if (!fechaLocal) return null
    // Convertir la fecha local a ISO string
    const fecha = new Date(fechaLocal)
    return fecha.toISOString()
  }

  const editarInversion = (inversion) => {
    // Formatear la fecha para el input datetime-local
    let fechaParaInput = ''
    if (inversion.fecha) {
      const fecha = new Date(inversion.fecha)
      const año = fecha.getFullYear()
      const mes = String(fecha.getMonth() + 1).padStart(2, '0')
      const dia = String(fecha.getDate()).padStart(2, '0')
      const horas = String(fecha.getHours()).padStart(2, '0')
      const minutos = String(fecha.getMinutes()).padStart(2, '0')
      fechaParaInput = `${año}-${mes}-${dia}T${horas}:${minutos}`
    }
    
    setEditandoId(inversion.id)
    setNuevaInversion({
      nombre: inversion.nombre,
      monto: inversion.monto.toString(),
      tipo_monto: inversion.tipo_monto,
      banco: inversion.banco || '',
      fecha: fechaParaInput // ✅ Cargar la fecha existente
    })
    setMostrarFormulario(true)
    setTimeout(() => {
      document.querySelector('.formulario-inversion')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleActualizarInversion = async (e) => {
    e.preventDefault()
    
    if (!nuevaInversion.nombre.trim()) {
      alert('Por favor ingresa el nombre de la inversión')
      return
    }
    
    if (!nuevaInversion.monto || parseFloat(nuevaInversion.monto) <= 0) {
      alert('Por favor ingresa un monto válido')
      return
    }
    
    if ((nuevaInversion.tipo_monto === 'tarjeta' || nuevaInversion.tipo_monto === 'transferencia') && !nuevaInversion.banco) {
      alert('Por favor selecciona un banco para esta transacción')
      return
    }
    
    try {
      const inversionData = {
        nombre: nuevaInversion.nombre,
        monto: parseFloat(nuevaInversion.monto),
        tipo_monto: nuevaInversion.tipo_monto,
        banco: (nuevaInversion.tipo_monto === 'tarjeta' || nuevaInversion.tipo_monto === 'transferencia') ? nuevaInversion.banco : null
      }
      
      // ✅ Si se proporcionó una fecha, actualizarla también
      if (nuevaInversion.fecha) {
        inversionData.fecha = formatearFechaParaGuardar(nuevaInversion.fecha)
      }
      
      const { error } = await supabase
        .from('inversiones')
        .update(inversionData)
        .eq('id', editandoId)
      
      if (error) throw error
      
      // Resetear formulario
      setNuevaInversion({
        nombre: '',
        monto: '',
        tipo_monto: 'efectivo',
        banco: '',
        fecha: ''
      })
      setEditandoId(null)
      setMostrarFormulario(false)
      
      await cargarInversiones()
      alert('Inversión actualizada exitosamente')
    } catch (error) {
      console.error('Error actualizando inversión:', error)
      alert('Error al actualizar la inversión')
    }
  }

  const handleAgregarInversion = async (e) => {
    e.preventDefault()
    
    if (!nuevaInversion.nombre.trim()) {
      alert('Por favor ingresa el nombre de la inversión')
      return
    }
    
    if (!nuevaInversion.monto || parseFloat(nuevaInversion.monto) <= 0) {
      alert('Por favor ingresa un monto válido')
      return
    }
    
    if ((nuevaInversion.tipo_monto === 'tarjeta' || nuevaInversion.tipo_monto === 'transferencia') && !nuevaInversion.banco) {
      alert('Por favor selecciona un banco para esta transacción')
      return
    }
    
    try {
      const inversionData = {
        nombre: nuevaInversion.nombre,
        monto: parseFloat(nuevaInversion.monto),
        tipo_monto: nuevaInversion.tipo_monto,
        banco: (nuevaInversion.tipo_monto === 'tarjeta' || nuevaInversion.tipo_monto === 'transferencia') ? nuevaInversion.banco : null
      }
      
      // ✅ Si se proporcionó una fecha manualmente, usarla; si no, usar NOW() de Supabase
      if (nuevaInversion.fecha) {
        inversionData.fecha = formatearFechaParaGuardar(nuevaInversion.fecha)
      }
      
      const { data, error } = await supabase
        .from('inversiones')
        .insert([inversionData])
        .select()
      
      if (error) throw error
      
      setNuevaInversion({
        nombre: '',
        monto: '',
        tipo_monto: 'efectivo',
        banco: '',
        fecha: ''
      })
      setMostrarFormulario(false)
      
      await cargarInversiones()
      alert('Inversión agregada exitosamente')
    } catch (error) {
      console.error('Error agregando inversión:', error)
      alert('Error al agregar la inversión')
    }
  }

  const handleSubmit = (e) => {
    if (editandoId) {
      handleActualizarInversion(e)
    } else {
      handleAgregarInversion(e)
    }
  }

  const cancelarEdicion = () => {
    setNuevaInversion({
      nombre: '',
      monto: '',
      tipo_monto: 'efectivo',
      banco: '',
      fecha: ''
    })
    setEditandoId(null)
    setMostrarFormulario(false)
  }

  const eliminarInversion = async (id, nombre) => {
    if (confirm(`¿Estás seguro de eliminar la inversión "${nombre}"?`)) {
      try {
        const { error } = await supabase
          .from('inversiones')
          .delete()
          .eq('id', id)
        
        if (error) throw error
        
        await cargarInversiones()
        alert('Inversión eliminada exitosamente')
      } catch (error) {
        console.error('Error eliminando inversión:', error)
        alert('Error al eliminar la inversión')
      }
    }
  }

  const formatFechaNicaragua = (fechaISO) => {
    if (!fechaISO) return 'Fecha no disponible'
    try {
      const fecha = new Date(fechaISO)
      if (isNaN(fecha.getTime())) return 'Fecha inválida'
      
      const d = fecha.getDate().toString().padStart(2, '0')
      const m = (fecha.getMonth() + 1).toString().padStart(2, '0')
      const y = fecha.getFullYear()
      
      let h = fecha.getHours()
      const min = fecha.getMinutes().toString().padStart(2, '0')
      const seg = fecha.getSeconds().toString().padStart(2, '0')
      const ampm = h >= 12 ? 'p.m.' : 'a.m.'
      
      h = h % 12
      h = h ? h.toString().padStart(2, '0') : '12'
      
      return `${d}/${m}/${y} ${h}:${min}:${seg} ${ampm}`
    } catch (e) {
      console.error('Error formateando fecha:', e)
      return fechaISO
    }
  }

  const getBancoNombre = (bancoKey) => {
    const bancos = {
      ficohsa: 'Ficohsa',
      lafise: 'Lafise',
      banpro: 'Banpro',
      avanz: 'Avanz',
      bac: 'BAC',
      bdf: 'BDF'
    }
    return bancos[bancoKey] || bancoKey
  }

  const getTipoMontoNombre = (tipo) => {
    const tipos = {
      transferencia: 'Transferencia',
      tarjeta: 'Tarjeta',
      efectivo: 'Efectivo'
    }
    return tipos[tipo] || tipo
  }

  const exportarExcel = () => {
    try {
      setExportando(true)

      const datosExcel = inversionesFiltradas.map(inv => ({
        'Fecha': formatFechaNicaragua(inv.fecha).split(' ')[0],
        'Hora': formatFechaNicaragua(inv.fecha).split(' ')[1],
        'Nombre': inv.nombre,
        'Monto': `C$${parseFloat(inv.monto || 0).toFixed(2)}`,
        'Tipo': getTipoMontoNombre(inv.tipo_monto),
        'Banco': inv.banco_nombre || 'N/A'
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(datosExcel)

      const colWidths = [
        { wch: 12 }, { wch: 12 }, { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
      ]
      ws['!cols'] = colWidths

      XLSX.utils.book_append_sheet(wb, ws, 'Inversiones')

      const resumenData = [{
        'Concepto': 'Total Inversiones',
        'Valor': `C$${resumen.totalMonto.toFixed(2)}`
      }, {
        'Concepto': 'Total Transferencias',
        'Valor': `C$${resumen.totalTransferencia.toFixed(2)}`
      }, {
        'Concepto': 'Total Tarjeta',
        'Valor': `C$${resumen.totalTarjeta.toFixed(2)}`
      }, {
        'Concepto': 'Total Efectivo',
        'Valor': `C$${resumen.totalEfectivo.toFixed(2)}`
      }, {
        'Concepto': 'Cantidad de Inversiones',
        'Valor': resumen.totalInversiones
      }]

      const wsResumen = XLSX.utils.json_to_sheet(resumenData)
      XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

      const nombreArchivo = `inversiones_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, nombreArchivo)

      setTimeout(() => setExportando(false), 1000)
    } catch (error) {
      console.error('Error exportando Excel:', error)
      alert('Error al exportar a Excel')
      setExportando(false)
    }
  }

  const exportarPDF = () => {
    try {
      setExportando(true)

      const doc = new jsPDF('landscape')
      
      doc.setFontSize(18)
      doc.setTextColor(139, 92, 246)
      doc.text('Reporte de Inversiones', 105, 20, { align: 'center' })

      doc.setFontSize(10)
      doc.setTextColor(100, 116, 139)
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-MX')}`, 105, 30, { align: 'center' })

      doc.setFontSize(14)
      doc.setTextColor(30, 41, 59)
      doc.text('Resumen', 20, 55)

      doc.setFontSize(10)
      doc.setTextColor(55, 65, 81)
      
      let y = 65
      const resumenItems = [
        `Total Inversiones: C$${resumen.totalMonto.toFixed(2)}`,
        `Transferencias: C$${resumen.totalTransferencia.toFixed(2)}`,
        `Tarjeta: C$${resumen.totalTarjeta.toFixed(2)}`,
        `Efectivo: C$${resumen.totalEfectivo.toFixed(2)}`,
        `Cantidad de inversiones: ${resumen.totalInversiones}`
      ]

      resumenItems.forEach(item => {
        doc.text(item, 25, y)
        y += 7
      })

      const tableColumn = ['Fecha', 'Hora', 'Nombre', 'Monto', 'Tipo', 'Banco']
      const tableRows = inversionesFiltradas.map(inv => {
        const fechaCompleta = formatFechaNicaragua(inv.fecha).split(' ')
        return [
          fechaCompleta[0] || '',
          fechaCompleta[1] || '',
          inv.nombre,
          `C$${parseFloat(inv.monto || 0).toFixed(2)}`,
          getTipoMontoNombre(inv.tipo_monto),
          inv.banco_nombre || 'N/A'
        ]
      })

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: y + 10,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [139, 92, 246], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 25 },
          2: { cellWidth: 70 },
          3: { cellWidth: 30 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25 }
        }
      })

      const nombreArchivo = `inversiones_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(nombreArchivo)

      setTimeout(() => setExportando(false), 1000)
    } catch (error) {
      console.error('Error exportando PDF:', error)
      alert(`Error al exportar a PDF: ${error.message}`)
      setExportando(false)
    }
  }

  const limpiarFiltros = () => {
    setFiltroTipoMonto('todos')
    setFiltroBanco('todos')
    setFiltroBusqueda('')
    setFiltroFechaInicio('')
    setFiltroFechaFin('')
  }

  return (
    <div className="inversiones-container">
      <div className="inversiones-header">
        <div className="inversiones-titulo-container">
          <h1 className="inversiones-titulo">Inversiones</h1>
          <p className="inversiones-subtitulo">Registro y seguimiento de inversiones</p>
        </div>
        
        <div className="inversiones-botones-header">
          <button
            onClick={() => {
              cancelarEdicion()
              setMostrarFormulario(!mostrarFormulario)
            }}
            className="btn-agregar"
          >
            <span className="btn-icon">➕</span>
            {mostrarFormulario ? 'Cancelar' : 'Nueva Inversión'}
          </button>
        </div>
      </div>

      {mostrarFormulario && (
        <div className="formulario-inversion">
          <h3 className="formulario-titulo">
            {editandoId ? '✏️ Editar Inversión' : '➕ Agregar Nueva Inversión'}
          </h3>
          <form onSubmit={handleSubmit} className="form-inversion">
            <div className="form-grupo">
              <label className="form-label">Nombre de la inversión *</label>
              <input
                type="text"
                value={nuevaInversion.nombre}
                onChange={(e) => setNuevaInversion({...nuevaInversion, nombre: e.target.value})}
                className="form-input"
                placeholder="Ej: Certificado de depósito, Acciones, etc."
                required
              />
            </div>

            <div className="form-grupo">
              <label className="form-label">Monto (C$) *</label>
              <input
                type="number"
                step="0.01"
                value={nuevaInversion.monto}
                onChange={(e) => setNuevaInversion({...nuevaInversion, monto: e.target.value})}
                className="form-input"
                placeholder="0.00"
                required
              />
            </div>

            <div className="form-grupo">
              <label className="form-label">Tipo de monto *</label>
              <select
                value={nuevaInversion.tipo_monto}
                onChange={(e) => {
                  setNuevaInversion({
                    ...nuevaInversion,
                    tipo_monto: e.target.value,
                    banco: e.target.value === 'efectivo' ? '' : nuevaInversion.banco
                  })
                }}
                className="form-select"
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>

            {(nuevaInversion.tipo_monto === 'tarjeta' || nuevaInversion.tipo_monto === 'transferencia') && (
              <div className="form-grupo">
                <label className="form-label">Banco *</label>
                <select
                  value={nuevaInversion.banco}
                  onChange={(e) => setNuevaInversion({...nuevaInversion, banco: e.target.value})}
                  className="form-select"
                  required
                >
                  <option value="">Selecciona un banco</option>
                  <option value="ficohsa">Ficohsa</option>
                  <option value="lafise">Lafise</option>
                  <option value="banpro">Banpro</option>
                  <option value="avanz">Avanz</option>
                  <option value="bac">BAC</option>
                  <option value="bdf">BDF</option>
                </select>
              </div>
            )}

            {/* ✅ Campo para fecha y hora */}
            <div className="form-grupo">
              <label className="form-label">
                {editandoId ? 'Fecha y hora (opcional)' : 'Fecha y hora (opcional, dejar vacío para usar actual)'}
              </label>
              <input
                type="datetime-local"
                value={nuevaInversion.fecha}
                onChange={(e) => setNuevaInversion({...nuevaInversion, fecha: e.target.value})}
                className="form-input"
                step="60" // Permite minutos, no segundos
              />
              {!editandoId && (
                <small className="form-help">
                  Si no seleccionas una fecha, se usará la fecha y hora actual
                </small>
              )}
              {editandoId && (
                <small className="form-help">
                  Si no modificas la fecha, se mantendrá la original
                </small>
              )}
            </div>

            <div className="form-botones">
              <button type="submit" className="btn-guardar">
                {editandoId ? '✏️ Actualizar Inversión' : '💾 Guardar Inversión'}
              </button>
              <button
                type="button"
                onClick={cancelarEdicion}
                className="btn-cancelar"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="filtros-adicionales">
        <div className="filtro-grupo">
          <label className="filtro-label">Tipo:</label>
          <select
            value={filtroTipoMonto}
            onChange={(e) => setFiltroTipoMonto(e.target.value)}
            className="filtro-select"
          >
            <option value="todos">Todos</option>
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </div>

        <div className="filtro-grupo">
          <label className="filtro-label">Banco:</label>
          <select
            value={filtroBanco}
            onChange={(e) => setFiltroBanco(e.target.value)}
            className="filtro-select"
          >
            <option value="todos">Todos</option>
            <option value="ficohsa">Ficohsa</option>
            <option value="lafise">Lafise</option>
            <option value="banpro">Banpro</option>
            <option value="avanz">Avanz</option>
            <option value="bac">BAC</option>
            <option value="bdf">BDF</option>
          </select>
        </div>

        <div className="filtro-grupo buscador">
          <label className="filtro-label">Buscar:</label>
          <input
            type="text"
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
            placeholder="Nombre, banco..."
            className="filtro-input"
          />
          {filtroBusqueda && (
            <button className="filtro-limpiar" onClick={() => setFiltroBusqueda('')}>✕</button>
          )}
        </div>

        <div className="filtro-grupo">
          <label className="filtro-label">Desde:</label>
          <input
            type="date"
            value={filtroFechaInicio}
            onChange={(e) => setFiltroFechaInicio(e.target.value)}
            className="filtro-date"
          />
        </div>

        <div className="filtro-grupo">
          <label className="filtro-label">Hasta:</label>
          <input
            type="date"
            value={filtroFechaFin}
            onChange={(e) => setFiltroFechaFin(e.target.value)}
            className="filtro-date"
          />
        </div>

        <button onClick={limpiarFiltros} className="btn-limpiar-filtros">🗑️ Limpiar filtros</button>

        <div className="filtro-info">
          Mostrando {inversionesFiltradas.length} de {inversiones.length} registros
        </div>
      </div>

      {/* Resumen */}
      <div className="resumen-grid">
        <div className="resumen-card total-card">
          <div className="resumen-card-content">
            <span className="resumen-card-label">TOTAL INVERTIDO</span>
            <strong className="resumen-card-value">
              C${resumen.totalMonto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </strong>
            <span className="resumen-card-sub">{resumen.totalInversiones} inversiones</span>
          </div>
          <div className="resumen-card-icon">💰</div>
        </div>

        <div className="resumen-card transferencia-card">
          <div className="resumen-card-content">
            <span className="resumen-card-label">TRANSFERENCIAS</span>
            <strong className="resumen-card-value">
              C${resumen.totalTransferencia.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="resumen-card-icon">🏦</div>
        </div>

        <div className="resumen-card tarjeta-card">
          <div className="resumen-card-content">
            <span className="resumen-card-label">TARJETA</span>
            <strong className="resumen-card-value">
              C${resumen.totalTarjeta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="resumen-card-icon">💳</div>
        </div>

        <div className="resumen-card efectivo-card">
          <div className="resumen-card-content">
            <span className="resumen-card-label">EFECTIVO</span>
            <strong className="resumen-card-value">
              C${resumen.totalEfectivo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="resumen-card-icon">💵</div>
        </div>
      </div>

      {/* Distribución por banco */}
      {Object.keys(resumen.porBanco).length > 0 && (
        <div className="bancos-resumen">
          <h3 className="bancos-titulo">Distribución por Banco</h3>
          <div className="bancos-grid">
            {resumen.porBanco.efectivo && resumen.porBanco.efectivo.cantidad > 0 && (
              <div className="banco-card efectivo-mini">
                <span className="banco-nombre">💵 Efectivo</span>
                <span className="banco-monto">C${resumen.porBanco.efectivo.monto.toFixed(2)}</span>
                <span className="banco-cantidad">{resumen.porBanco.efectivo.cantidad} transacciones</span>
              </div>
            )}
            {Object.entries(resumen.porBanco).map(([banco, datos]) => {
              if (banco !== 'efectivo' && banco !== 'sin_banco' && datos.cantidad > 0) {
                return (
                  <div key={banco} className="banco-card">
                    <span className="banco-nombre">{getBancoNombre(banco)}</span>
                    <span className="banco-monto">C${datos.monto.toFixed(2)}</span>
                    <span className="banco-cantidad">{datos.cantidad} transacciones</span>
                  </div>
                )
              }
              return null
            })}
          </div>
        </div>
      )}

      {/* Botones exportar */}
      <div className="export-buttons">
        <button
          onClick={exportarExcel}
          disabled={loading || inversionesFiltradas.length === 0 || exportando}
          className="btn-exportar excel"
        >
          {exportando ? (<><span className="spinner-mini"></span>Exportando...</>) : (<><span className="btn-icon">📊</span>Exportar Excel</>)}
        </button>
        <button
          onClick={exportarPDF}
          disabled={loading || inversionesFiltradas.length === 0 || exportando}
          className="btn-exportar pdf"
        >
          {exportando ? (<><span className="spinner-mini"></span>Exportando...</>) : (<><span className="btn-icon">📄</span>Exportar PDF</>)}
        </button>
      </div>

      {/* Tabla */}
      <div className="tabla-inversiones-container">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Cargando inversiones...</p>
          </div>
        ) : inversionesFiltradas.length === 0 ? (
          <div className="sin-datos">
            <p>No hay inversiones para los filtros seleccionados</p>
          </div>
        ) : (
          <div className="tabla-scroll">
            <table className="tabla-inversiones">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Nombre</th>
                  <th>Monto</th>
                  <th>Tipo</th>
                  <th>Banco</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {inversionesFiltradas.map((inversion) => {
                  const fechaCompleta = inversion.fecha_formateada.split(' ')
                  return (
                    <tr key={inversion.id}>
                      <td className="col-fecha">{fechaCompleta[0] || ''}</td>
                      <td className="col-hora">{fechaCompleta[1] || ''}</td>
                      <td className="col-nombre">{inversion.nombre}</td>
                      <td className="col-monto">C${parseFloat(inversion.monto || 0).toFixed(2)}</td>
                      <td className="col-tipo">
                        <span className={`badge-tipo ${inversion.tipo_monto}`}>
                          {inversion.tipo_monto_nombre}
                        </span>
                      </td>
                      <td className="col-banco">
                        {inversion.banco_nombre ? (
                          <span className={`badge-banco ${inversion.banco}`}>
                            {inversion.banco_nombre}
                          </span>
                        ) : inversion.tipo_monto === 'efectivo' ? (
                          <span className="badge-banco efectivo">Efectivo</span>
                        ) : (
                          <span className="badge-banco sin-banco">No especificado</span>
                        )}
                      </td>
                      <td className="col-acciones">
                        <button
                          onClick={() => editarInversion(inversion)}
                          className="btn-editar"
                          title="Editar inversión"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => eliminarInversion(inversion.id, inversion.nombre)}
                          className="btn-eliminar"
                          title="Eliminar inversión"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Inversiones