// src/views/ReportesMensuales.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../database/supabase'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import './ReportesMensuales.css'

const ReportesMensuales = () => {
  const [facturas, setFacturas] = useState([])
  const [facturasFiltradas, setFacturasFiltradas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroMes, setFiltroMes] = useState(() => {
    const ahora = new Date()
    return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`
  })
  
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroMetodo, setFiltroMetodo] = useState('todos')
  const [filtroBusqueda, setFiltroBusqueda] = useState('')
  
  const [resumen, setResumen] = useState({
    totalVentas: 0,
    totalCreditos: 0,
    totalEfectivo: 0,
    totalTarjeta: 0,
    totalTransferencia: 0,
    totalGastos: 0,
    cantidadRegistros: 0,
    cantidadGastos: 0
  })
  const [exportando, setExportando] = useState(false)

  useEffect(() => {
    cargarFacturas()
  }, [filtroMes])

  useEffect(() => {
    aplicarFiltros()
  }, [facturas, filtroTipo, filtroMetodo, filtroBusqueda])

  const cargarFacturas = async () => {
    try {
      setLoading(true)
      
      const [year, month] = filtroMes.split('-')
      const inicioMes = new Date(year, month - 1, 1).toISOString()
      const finMes = new Date(year, month, 0, 23, 59, 59).toISOString()

      const { data, error } = await supabase
        .from('facturados')
        .select('*')
        .gte('fecha', inicioMes)
        .lt('fecha', finMes)
        .order('fecha', { ascending: false })

      if (error) throw error

      // ✅ PROCESAR FACTURAS SIN CONSULTAS ADICIONALES
      const facturasProcesadas = (data || []).map(factura => {
        let detalle = ''
        
        // Si es un GASTO, usar la descripción guardada
        if (factura.tipo_venta === 'gasto') {
          detalle = factura.descripcion || 'Gasto sin descripción'
        } 
        // Si es un CRÉDITO
        else if (factura.tipo_venta === 'credito') {
          detalle = factura.cliente_nombre || `Crédito ${factura.id?.substring(0, 8)}`
        }
        // Si es una VENTA normal
        else if (factura.tipo_venta === 'normal') {
          detalle = `Venta ${factura.id?.substring(0, 8)}`
        }
        // Si es un ABONO
        else if (factura.tipo_venta === 'abono_credito') {
          detalle = `Abono ${factura.id?.substring(0, 8)}`
        }

        return {
          ...factura,
          fecha_formateada: formatFechaNicaragua(factura.fecha),
          detalle_texto: detalle
        }
      })

      setFacturas(facturasProcesadas)

    } catch (error) {
      console.error('Error cargando facturas:', error)
      alert('Error al cargar los reportes mensuales')
    } finally {
      setLoading(false)
    }
  }

  const aplicarFiltros = () => {
    let filtradas = [...facturas]
    
    if (filtroTipo !== 'todos') {
      if (filtroTipo === 'gasto') {
        filtradas = filtradas.filter(f => f.tipo_venta === 'gasto')
      } else if (filtroTipo === 'credito') {
        filtradas = filtradas.filter(f => f.tipo_venta === 'credito')
      } else if (filtroTipo === 'venta') {
        filtradas = filtradas.filter(f => f.tipo_venta === 'normal')
      } else if (filtroTipo === 'abono') {
        filtradas = filtradas.filter(f => f.tipo_venta === 'abono_credito')
      }
    }
    
    if (filtroMetodo !== 'todos') {
      filtradas = filtradas.filter(f => f.metodo_pago === filtroMetodo)
    }
    
    if (filtroBusqueda.trim() !== '') {
      const termino = filtroBusqueda.toLowerCase()
      filtradas = filtradas.filter(f => {
        return (
          (f.detalle_texto && f.detalle_texto.toLowerCase().includes(termino)) ||
          (f.descripcion && f.descripcion.toLowerCase().includes(termino)) ||
          (f.id && f.id.toLowerCase().includes(termino))
        )
      })
    }
    
    setFacturasFiltradas(filtradas)
    calcularResumen(filtradas)
  }

  const formatFechaNicaragua = (fechaISO) => {
    if (!fechaISO) return 'Fecha no disponible'
    try {
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
    } catch (e) {
      return fechaISO
    }
  }

  const obtenerTextoDetalle = (factura) => {
    // Para gastos, usar la descripción guardada
    if (factura.tipo_venta === 'gasto') {
      return factura.descripcion || 'Gasto sin descripción'
    }
    // Para otros tipos, usar el detalle procesado
    return factura.detalle_texto || 'Sin detalle'
  }

  const calcularResumen = (facturasData) => {
    let totalVentas = 0
    let totalCreditos = 0
    let totalEfectivo = 0
    let totalTarjeta = 0
    let totalTransferencia = 0
    let totalGastos = 0
    let cantidadGastos = 0

    facturasData.forEach(f => {
      const monto = parseFloat(f.total || 0)
      totalVentas += monto
      
      if (f.tipo_venta === 'credito') {
        totalCreditos += monto
      }
      
      if (f.metodo_pago === 'efectivo') {
        totalEfectivo += monto
      } else if (f.metodo_pago === 'tarjeta') {
        totalTarjeta += monto
      } else if (f.metodo_pago === 'transferencia') {
        totalTransferencia += monto
      }
      
      if (f.tipo_venta === 'gasto') {
        totalGastos += monto
        cantidadGastos++
      }
    })

    setResumen({
      totalVentas,
      totalCreditos,
      totalEfectivo,
      totalTarjeta,
      totalTransferencia,
      totalGastos,
      cantidadRegistros: facturasData.length,
      cantidadGastos
    })
  }

  const generarMesesDisponibles = () => {
    const meses = []
    const ahora = new Date()
    
    for (let i = 0; i < 12; i++) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
      const valor = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      const nombre = fecha.toLocaleDateString('es-MX', { year: 'numeric', month: 'long' })
      meses.push({ valor, nombre })
    }
    
    return meses
  }

  const exportarExcel = () => {
    try {
      setExportando(true)

      const datosExcel = facturasFiltradas.map(f => ({
        'Fecha': formatFechaNicaragua(f.fecha).split(' ')[0],
        'Tipo': f.tipo_venta === 'gasto' ? 'Gasto' : 
                f.tipo_venta === 'credito' ? 'Crédito' : 
                f.tipo_venta === 'normal' ? 'Venta' : 'Abono',
        'Detalle': obtenerTextoDetalle(f),
        'Método': f.metodo_pago || '',
        'Monto': `C$${parseFloat(f.total || 0).toFixed(2)}`
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(datosExcel)

      const colWidths = [
        { wch: 15 }, // Fecha
        { wch: 10 }, // Tipo
        { wch: 40 }, // Detalle
        { wch: 15 }, // Método
        { wch: 15 }  // Monto
      ]
      ws['!cols'] = colWidths

      XLSX.utils.book_append_sheet(wb, ws, 'Facturas')

      const resumenData = [{
        'Concepto': 'Total Ventas',
        'Monto': `C$${resumen.totalVentas.toFixed(2)}`
      }, {
        'Concepto': 'Ventas a Crédito',
        'Monto': `C$${resumen.totalCreditos.toFixed(2)}`
      }, {
        'Concepto': 'Efectivo',
        'Monto': `C$${resumen.totalEfectivo.toFixed(2)}`
      }, {
        'Concepto': 'Tarjeta',
        'Monto': `C$${resumen.totalTarjeta.toFixed(2)}`
      }, {
        'Concepto': 'Transferencia',
        'Monto': `C$${resumen.totalTransferencia.toFixed(2)}`
      }, {
        'Concepto': 'Total Gastos',
        'Monto': `C$${resumen.totalGastos.toFixed(2)}`
      }, {
        'Concepto': 'Cantidad Gastos',
        'Monto': resumen.cantidadGastos
      }, {
        'Concepto': 'Registros Mostrados',
        'Monto': resumen.cantidadRegistros
      }]

      const wsResumen = XLSX.utils.json_to_sheet(resumenData)
      XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

      const [year, month] = filtroMes.split('-')
      const nombreMes = new Date(year, month - 1).toLocaleDateString('es-MX', { month: 'long' })
      const nombreArchivo = `facturas_${nombreMes}_${year}.xlsx`

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
      
      const [year, month] = filtroMes.split('-')
      const nombreMes = new Date(year, month - 1).toLocaleDateString('es-MX', { month: 'long' })

      doc.setFontSize(18)
      doc.setTextColor(139, 92, 246)
      doc.text(`Reporte de Facturas - ${nombreMes} ${year}`, 105, 20, { align: 'center' })

      doc.setFontSize(10)
      doc.setTextColor(100, 116, 139)
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-MX')}`, 105, 30, { align: 'center' })

      doc.setFontSize(10)
      doc.setTextColor(55, 65, 81)
      
      let filtrosTexto = `Filtros: `
      if (filtroTipo !== 'todos') filtrosTexto += `Tipo: ${filtroTipo} `
      if (filtroMetodo !== 'todos') filtrosTexto += `Método: ${filtroMetodo} `
      if (filtroBusqueda) filtrosTexto += `Búsqueda: "${filtroBusqueda}" `
      if (filtrosTexto === 'Filtros: ') filtrosTexto = 'Filtros: Todos'
      
      doc.text(filtrosTexto, 20, 40)

      doc.setFontSize(14)
      doc.setTextColor(30, 41, 59)
      doc.text('Resumen del Mes', 20, 55)

      doc.setFontSize(10)
      doc.setTextColor(55, 65, 81)
      
      let y = 65
      const resumenItems = [
        `Total Ventas: C$${resumen.totalVentas.toFixed(2)}`,
        `Ventas a Crédito: C$${resumen.totalCreditos.toFixed(2)}`,
        `Efectivo: C$${resumen.totalEfectivo.toFixed(2)}`,
        `Tarjeta: C$${resumen.totalTarjeta.toFixed(2)}`,
        `Transferencia: C$${resumen.totalTransferencia.toFixed(2)}`,
        `Total Gastos: C$${resumen.totalGastos.toFixed(2)}`,
        `Cantidad Gastos: ${resumen.cantidadGastos}`,
        `Registros Mostrados: ${resumen.cantidadRegistros}`
      ]

      resumenItems.forEach(item => {
        doc.text(item, 25, y)
        y += 7
      })

      const tableColumn = ['Fecha', 'Tipo', 'Detalle', 'Método', 'Monto']
      const tableRows = facturasFiltradas.map(f => [
        formatFechaNicaragua(f.fecha).split(' ')[0],
        f.tipo_venta === 'gasto' ? 'Gasto' : 
        f.tipo_venta === 'credito' ? 'Crédito' : 
        f.tipo_venta === 'normal' ? 'Venta' : 'Abono',
        obtenerTextoDetalle(f),
        f.metodo_pago || '',
        `C$${parseFloat(f.total || 0).toFixed(2)}`
      ])

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: y + 10,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [139, 92, 246], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 25 },
          2: { cellWidth: 80 },
          3: { cellWidth: 35 },
          4: { cellWidth: 30 }
        }
      })

      const nombreArchivo = `facturas_${nombreMes}_${year}.pdf`
      doc.save(nombreArchivo)

      setTimeout(() => setExportando(false), 1000)

    } catch (error) {
      console.error('Error exportando PDF:', error)
      alert(`Error al exportar a PDF: ${error.message}`)
      setExportando(false)
    }
  }

  const mesesDisponibles = generarMesesDisponibles()

  return (
    <div className="reportes-container">
      <div className="reportes-header">
        <div className="reportes-titulo-container">
          <h1 className="reportes-titulo">Reportes Mensuales</h1>
          <p className="reportes-subtitulo">Facturas archivadas por mes</p>
        </div>
        
        <div className="reportes-botones-header">
          <select
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
            className="selector-mes"
            disabled={loading}
          >
            {mesesDisponibles.map(({ valor, nombre }) => (
              <option key={valor} value={valor}>
                {nombre.charAt(0).toUpperCase() + nombre.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="filtros-adicionales">
        <div className="filtro-grupo">
          <label className="filtro-label">Tipo:</label>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="filtro-select"
          >
            <option value="todos">Todos</option>
            <option value="venta">Ventas</option>
            <option value="credito">Créditos</option>
            <option value="gasto">Gastos</option>
            <option value="abono">Abonos</option>
          </select>
        </div>

        <div className="filtro-grupo">
          <label className="filtro-label">Método:</label>
          <select
            value={filtroMetodo}
            onChange={(e) => setFiltroMetodo(e.target.value)}
            className="filtro-select"
          >
            <option value="todos">Todos</option>
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </div>

        <div className="filtro-grupo buscador">
          <label className="filtro-label">Buscar:</label>
          <input
            type="text"
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
            placeholder="Descripción, cliente, ID..."
            className="filtro-input"
          />
          {filtroBusqueda && (
            <button
              className="filtro-limpiar"
              onClick={() => setFiltroBusqueda('')}
            >
              ✕
            </button>
          )}
        </div>

        <div className="filtro-info">
          Mostrando {facturasFiltradas.length} de {facturas.length} registros
        </div>
      </div>

      <div className="resumen-grid">
        <div className="resumen-card total-card">
          <div className="resumen-card-content">
            <span className="resumen-card-label">TOTAL VENTAS</span>
            <strong className="resumen-card-value">
              C${resumen.totalVentas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </strong>
            <span className="resumen-card-sub">{resumen.cantidadRegistros} registros</span>
          </div>
          <div className="resumen-card-icon">💰</div>
        </div>

        <div className="resumen-card credito-card">
          <div className="resumen-card-content">
            <span className="resumen-card-label">VENTAS CRÉDITO</span>
            <strong className="resumen-card-value">
              C${resumen.totalCreditos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
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

        <div className="resumen-card tarjeta-card">
          <div className="resumen-card-content">
            <span className="resumen-card-label">TARJETA</span>
            <strong className="resumen-card-value">
              C${resumen.totalTarjeta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="resumen-card-icon">💳</div>
        </div>

        <div className="resumen-card transferencia-card">
          <div className="resumen-card-content">
            <span className="resumen-card-label">TRANSFERENCIA</span>
            <strong className="resumen-card-value">
              C${resumen.totalTransferencia.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="resumen-card-icon">🏦</div>
        </div>

        <div className="resumen-card gastos-card">
          <div className="resumen-card-content">
            <span className="resumen-card-label">TOTAL GASTOS</span>
            <strong className="resumen-card-value">
              C${resumen.totalGastos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </strong>
            <span className="resumen-card-sub">{resumen.cantidadGastos} gastos</span>
          </div>
          <div className="resumen-card-icon">📉</div>
        </div>
      </div>

      <div className="export-buttons">
        <button
          onClick={exportarExcel}
          disabled={loading || facturasFiltradas.length === 0 || exportando}
          className="btn-exportar excel"
        >
          {exportando ? (
            <>
              <span className="spinner-mini"></span>
              Exportando...
            </>
          ) : (
            <>
              <span className="btn-icon">📊</span>
              Exportar Excel
            </>
          )}
        </button>
        <button
          onClick={exportarPDF}
          disabled={loading || facturasFiltradas.length === 0 || exportando}
          className="btn-exportar pdf"
        >
          {exportando ? (
            <>
              <span className="spinner-mini"></span>
              Exportando...
            </>
          ) : (
            <>
              <span className="btn-icon">📄</span>
              Exportar PDF
            </>
          )}
        </button>
      </div>

      <div className="tabla-facturas-container">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Cargando facturas...</p>
          </div>
        ) : facturasFiltradas.length === 0 ? (
          <div className="sin-datos">
            <p>No hay facturas para los filtros seleccionados</p>
          </div>
        ) : (
          <div className="tabla-scroll">
            <table className="tabla-facturas">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Detalle</th>
                  <th>Método</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {facturasFiltradas.map((factura) => (
                  <tr key={factura.id}>
                    <td className="col-fecha">{formatFechaNicaragua(factura.fecha)}</td>
                    <td className="col-tipo">
                      <span className={`badge-tipo ${factura.tipo_venta}`}>
                        {factura.tipo_venta === 'gasto' ? 'Gasto' : 
                         factura.tipo_venta === 'credito' ? 'Crédito' : 
                         factura.tipo_venta === 'normal' ? 'Venta' : 'Abono'}
                      </span>
                    </td>
                    <td className="col-detalle">
                      {obtenerTextoDetalle(factura)}
                    </td>
                    <td className="col-metodo">
                      <span className={`badge-metodo ${factura.metodo_pago || 'default'}`}>
                        {factura.metodo_pago || 'No especificado'}
                      </span>
                    </td>
                    <td className="col-monto">C${parseFloat(factura.total || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReportesMensuales