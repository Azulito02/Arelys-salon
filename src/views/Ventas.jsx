// Ventas.jsx - VERSIÓN CORREGIDA CON TICKET AGRUPADO POR CLIENTE/VENTA
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../database/supabase'
import TablaVentas from '../components/ventas/TablaVentas'
import ModalNuevaVenta from '../components/ventas/ModalNuevaVenta'
import ModalEditarVenta from '../components/ventas/ModalEditarVenta'
import ModalEliminarVenta from '../components/ventas/ModalEliminarVenta'
import '../components/ventas/TablaVentas.css'
import '../components/ventas/Ventas.css'

const Ventas = () => {
  const [ventas, setVentas] = useState([])
  const [productos, setProductos] = useState([])
  const [servicios, setServicios] = useState([]) // ✅ NUEVO: servicios
  const [itemsDisponibles, setItemsDisponibles] = useState([]) 
  const [loading, setLoading] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  const [imprimiendo, setImprimiendo] = useState(false)
  
  // Estados para modales
  const [modalNuevaAbierto, setModalNuevaAbierto] = useState(false)
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false)
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false)

  // Estados para código de barras
  const [codigoBarrasInput, setCodigoBarrasInput] = useState('')
  const scannerInputRef = useRef(null)
  
  // Estados para datos
  const [nuevaVenta, setNuevaVenta] = useState({
    producto_id: '',
    cantidad: 1,
    precio_unitario: 0,
    total: 0
  })
  
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null)

  useEffect(() => {
    cargarDatos()
    scannerInputRef.current?.focus()
  }, [])

  // ==============================================
  // CARGAR DATOS
  // ==============================================

  const cargarDatos = async () => {
try {
  setLoading(true)
  setErrorCarga('')
  
  // 1️⃣ Cargar TODOS los productos por lotes (evita el límite de 1000 filas de Supabase)
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

  console.log('Productos cargados:', productosData?.length)
  setProductos(productosData || [])
  
  // 2️⃣ Cargar servicios
  const { data: serviciosData, error: errorServicios } = await supabase
    .from('servicios')
    .select('*')
    .order('nombre')
  
  if (errorServicios) throw errorServicios
  console.log('Servicios cargados:', serviciosData?.length)
  setServicios(serviciosData || [])
  
  // 3️⃣ Cargar ventas
  const { data: ventasData, error: errorVentas } = await supabase
    .from('ventas')
    .select('*')
    .order('fecha', { ascending: false })
  
  if (errorVentas) throw errorVentas
  
  // 4️⃣ Procesar ventas - 🔴 VERSIÓN CORREGIDA
  const ventasProcesadas = (ventasData || []).map(venta => {
    let item = null
    
    if (venta.producto_id) {
      item = productosData?.find(p => p.id === venta.producto_id) || null
      
      if (item) {
        console.log(`✅ Producto encontrado: ${item.nombre} para ID: ${venta.producto_id}`)
      } else {
        console.log(`❌ Producto NO encontrado para ID: ${venta.producto_id}`)
      }
    } 
    
    if (!item && venta.servicio_id) {
      item = serviciosData?.find(s => s.id === venta.servicio_id) || null
      
      if (item) {
        console.log(`✅ Servicio encontrado: ${item.nombre} para ID: ${venta.servicio_id}`)
      } else {
        console.log(`❌ Servicio NO encontrado para ID: ${venta.servicio_id}`)
      }
    }
    
    return {
      ...venta,
      item: item || { 
        id: null, 
        nombre: 'Producto/Servicio no encontrado',
        precio: venta.precio_unitario || 0
      },
      tipo_item: venta.producto_id ? 'producto' : venta.servicio_id ? 'servicio' : null
    }
  })
  
  setVentas(ventasProcesadas)
  
  // 5️⃣ Combinar para búsquedas
  const combinados = [
    ...(productosData || []).map(p => ({ ...p, tipo: 'producto' })),
    ...(serviciosData || []).map(s => ({ ...s, tipo: 'servicio' }))
  ]
  setItemsDisponibles(combinados)
  
} catch (error) {
  console.error('Error cargando ventas:', error)
  setErrorCarga(`Error al cargar datos: ${error.message}`)
} finally {
  setLoading(false)
}
}

  // ==============================================
  // FUNCIÓN DE IMPRESIÓN - POR VENTA COMPLETA
  // ==============================================

  const imprimirTicket = (venta) => {
    try {
      setImprimiendo(true)
      
      const isAndroid = /Android/.test(navigator.userAgent)
      if (!isAndroid) {
        alert('⚠️ Esta función solo está disponible en dispositivos Android')
        setImprimiendo(false)
        return
      }
      
      const contenido = generarContenidoTicket(venta)
      const encoded = encodeURIComponent(contenido)
      window.location.href = `rawbt:${encoded}`
      
      setTimeout(() => {
        if (!document.hidden) {
          mostrarContenidoParaCopiar(contenido)
        }
      }, 1500)
      
      setTimeout(() => {
        setImprimiendo(false)
      }, 2000)
      
    } catch (error) {
      console.error('Error al imprimir:', error)
      alert(`❌ Error: ${error.message}`)
      setImprimiendo(false)
    }
  }

// ==============================================
// GENERAR CONTENIDO DEL TICKET - VUELTO CORREGIDO (VERSIÓN FINAL)
// ==============================================

const generarContenidoTicket = (venta) => {
  const centrar = (texto) => {
    const ancho = 32
    const espacios = Math.max(0, Math.floor((ancho - texto.length) / 2))
    return " ".repeat(espacios) + texto
  }

  const linea = () => "--------------------------------"

  const formatFecha = (fechaISO) => {
    const fecha = fechaISO ? new Date(fechaISO) : new Date()
    const fechaNic = new Date(fecha.getTime() - (6 * 60 * 60 * 1000))

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

  // 🔴 CORREGIDO: AGRUPAR POR FECHA EXACTA (MILISEGUNDOS)
  const fechaVentaOriginal = new Date(venta.fecha).getTime()
  
  const productosDeEstaVenta = ventas.filter(v => {
    const fechaVentaComparar = new Date(v.fecha).getTime()
    // Diferencia de menos de 1 segundo = misma transacción
    return Math.abs(fechaVentaComparar - fechaVentaOriginal) < 1000
  })

  // Si no encuentra productos, usar solo el producto actual
  const productosTicket = productosDeEstaVenta.length > 0 
    ? productosDeEstaVenta 
    : [venta]

  const fecha = formatFecha(venta.fecha)
  const numeroVenta = venta.id
    ? venta.id.substring(0, 8).toUpperCase()
    : "00000000"

  // ==============================================
  // CALCULAR TOTALES DE TODA LA TRANSACCIÓN
  // ==============================================
  
  let totalGeneral = 0
  let efectivoTotal = 0
  let tarjetaTotal = 0
  let transferenciaTotal = 0
  
  // 🔴 CORREGIDO: BUSCAR EL VUELTO REAL (TODOS DEBEN TENER EL MISMO)
  let vueltoReal = 0
  
  // Primero, buscar si ALGÚN producto tiene vuelto
  productosTicket.forEach(v => {
    totalGeneral += Number(v.total || 0)
    
    // Sumar montos por método de pago
    if (v.metodo_pago === "efectivo") {
      efectivoTotal += Number(v.efectivo || v.total || 0)
    } else if (v.metodo_pago === "tarjeta") {
      tarjetaTotal += Number(v.tarjeta || v.total || 0)
    } else if (v.metodo_pago === "transferencia") {
      transferenciaTotal += Number(v.transferencia || v.total || 0)
    } else if (v.metodo_pago === "mixto") {
      efectivoTotal += Number(v.efectivo || 0)
      tarjetaTotal += Number(v.tarjeta || 0)
      transferenciaTotal += Number(v.transferencia || 0)
    }
    
    // 🔴 CORREGIDO: Guardar el primer vuelto que encontremos
    if (v.vuelto && v.vuelto > 0 && vueltoReal === 0) {
      vueltoReal = Number(v.vuelto)
    }
  })

  const recibidoTotal = efectivoTotal + tarjetaTotal + transferenciaTotal

  // 🔴 CORREGIDO: Si NO encontramos vuelto, calcularlo
  if (vueltoReal === 0 && recibidoTotal > totalGeneral) {
    vueltoReal = recibidoTotal - totalGeneral
  }

  // 🔴 CORREGIDO: Redondear a 2 decimales
  vueltoReal = Math.round(vueltoReal * 100) / 100

  let contenido = `
${centrar("ARELYS SALON")}
${centrar("8354-3180")}
${centrar("Uno petrol una cuadra al norte media al oeste")}
${linea()}
        TICKET DE VENTA
${linea()}
FECHA: ${fecha}
N°: ${numeroVenta}
${linea()}`

  // ==============================================
  // LISTAR TODOS LOS PRODUCTOS DE LA TRANSACCIÓN
  // ==============================================
  
  
  if (productosTicket.length === 1) {
    // SOLO UN ITEM - Formato simple
    const v = productosTicket[0]
    // 🔴 CORREGIDO: Usar v.item en lugar de v.productos
    const nombre = v.item?.nombre || "Producto/Servicio"
    const cantidad = v.cantidad || 1
    const precio = Number(v.precio_unitario || 0).toFixed(2)
    
    contenido += `
ITEM: ${nombre}
CANTIDAD: ${cantidad}
PRECIO:   C$${precio}
`
  } else {
    // VARIOS ITEMS - Formato listado
    contenido += `\nITEMS:\n`
    productosTicket.forEach((v, index) => {
      // 🔴 CORREGIDO: Usar v.item en lugar de v.productos
      const nombre = v.item?.nombre || "Producto/Servicio"
      const cantidad = v.cantidad || 1
      const precio = Number(v.precio_unitario || 0).toFixed(2)
      const subtotal = Number(v.total || 0).toFixed(2)
      const tipo = v.tipo_item === 'servicio' ? '🔹' : '📦'
      
      contenido += `
${index + 1}. ${tipo} ${nombre}
   ${cantidad} x C$${precio} = C$${subtotal}`
    })
    contenido += `\n`
  }
  contenido += `${linea()}
TOTAL:      C$${totalGeneral.toFixed(2)}
`

  // ==============================================
  // DETALLE DE PAGO
  // ==============================================
  
  const esMixto = (efectivoTotal > 0 && tarjetaTotal > 0) || 
                  (efectivoTotal > 0 && transferenciaTotal > 0) ||
                  (tarjetaTotal > 0 && transferenciaTotal > 0)

  if (esMixto) {
    contenido += `${linea()}
PAGO MIXTO:
`
    if (efectivoTotal > 0) {
      contenido += `   💵 Efectivo:   C$${efectivoTotal.toFixed(2)}\n`
    }
    if (tarjetaTotal > 0) {
      const banco = productosTicket[0]?.detalles_pago?.banco_tarjeta || ''
      contenido += `   💳 Tarjeta:    C$${tarjetaTotal.toFixed(2)}${banco ? ` [${banco}]` : ''}\n`
    }
    if (transferenciaTotal > 0) {
      const banco = productosTicket[0]?.detalles_pago?.banco_transferencia || ''
      contenido += `   🏦 Transfer:   C$${transferenciaTotal.toFixed(2)}${banco ? ` [${banco}]` : ''}\n`
    }
  } else {
    // MÉTODO SIMPLE
    let metodoTexto = ""
    let bancoTexto = ""
    let icono = ""
    
    if (venta.metodo_pago === "efectivo") {
      metodoTexto = "EFECTIVO"
      icono = "💰"
    } else if (venta.metodo_pago === "tarjeta") {
      metodoTexto = "TARJETA"
      icono = "💳"
      bancoTexto = venta.detalles_pago?.banco_tarjeta || venta.detalles_pago?.banco || ''
    } else if (venta.metodo_pago === "transferencia") {
      metodoTexto = "TRANSFERENCIA"
      icono = "🏦"
      bancoTexto = venta.detalles_pago?.banco_transferencia || venta.detalles_pago?.banco || ''
    }
    
    contenido += `${linea()}
${icono} METODO: ${metodoTexto}
`
    if (bancoTexto) {
      contenido += `   BANCO: ${bancoTexto}\n`
    }
  }

  // 🔴 CORREGIDO: SIEMPRE usar el MISMO vuelto para TODOS los productos
  contenido += `${linea()}
RECIBIDO:   C$${recibidoTotal.toFixed(2)}
`

  if (vueltoReal > 0) {
    contenido += `VUELTO:     C$${vueltoReal.toFixed(2)}\n`
  }

  contenido += `${linea()}
${centrar("¡GRACIAS POR SU COMPRA!")}
${centrar("VUELVA PRONTO")}

\n\n\n\n\n`

  return contenido
}

  // ==============================================
  // FALLBACK PARA COPIAR CONTENIDO
  // ==============================================

  const mostrarContenidoParaCopiar = (contenido) => {
    // ... (mantener el mismo código de fallback que ya tienes)
    const ventana = window.open('', '_blank')
    ventana.document.write(`
      <html>
        <head>
          <title>Contenido del Ticket - ARELY Z SALON</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 20px;
              min-height: 100vh;
            }
            
            .container {
              max-width: 100%;
              margin: 0 auto;
              background: white;
              border-radius: 15px;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
              overflow: hidden;
            }
            
            .header {
              background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
              color: white;
              padding: 25px 20px;
              text-align: center;
              border-bottom: 3px solid #3730a3;
            }
            
            .header h1 {
              font-size: 24px;
              margin-bottom: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
            }
            
            .header p {
              opacity: 0.9;
              font-size: 14px;
            }
            
            .content {
              padding: 25px;
            }
            
            .instructions {
              background: #f0f9ff;
              border: 2px solid #0ea5e9;
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 25px;
            }
            
            .instructions h3 {
              color: #0369a1;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            
            .instructions ol {
              padding-left: 20px;
              color: #475569;
            }
            
            .instructions li {
              margin-bottom: 10px;
              line-height: 1.5;
            }
            
            .ticket-content {
              background: #f8fafc;
              border: 2px solid #e2e8f0;
              border-radius: 10px;
              padding: 20px;
              margin: 20px 0;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              white-space: pre;
              overflow-x: auto;
              max-height: 400px;
              overflow-y: auto;
              border-left: 4px solid #4f46e5;
            }
            
            .buttons {
              display: flex;
              gap: 12px;
              margin-top: 25px;
              flex-wrap: wrap;
              justify-content: center;
            }
            
            .btn {
              padding: 14px 28px;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 600;
              font-size: 15px;
              transition: all 0.3s ease;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
              min-width: 180px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            
            .btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
            }
            
            .btn:active {
              transform: translateY(0);
            }
            
            .btn-copy {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
            }
            
            .btn-copy:hover {
              background: linear-gradient(135deg, #059669 0%, #047857 100%);
            }
            
            .btn-print {
              background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
              color: white;
            }
            
            .btn-print:hover {
              background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
            }
            
            .btn-close {
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              color: white;
            }
            
            .btn-close:hover {
              background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            }
            
            .btn-rawbt {
              background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
              color: white;
            }
            
            .btn-rawbt:hover {
              background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
            }
            
            .icon {
              width: 20px;
              height: 20px;
              stroke-width: 2;
            }
            
            .device-info {
              background: #fef3c7;
              border: 2px solid #f59e0b;
              border-radius: 10px;
              padding: 15px;
              margin-top: 20px;
              text-align: center;
              color: #92400e;
              font-weight: 500;
            }
            
            @media (max-width: 600px) {
              body {
                padding: 10px;
              }
              
              .header {
                padding: 20px 15px;
              }
              
              .header h1 {
                font-size: 20px;
              }
              
              .content {
                padding: 20px 15px;
              }
              
              .btn {
                width: 100%;
                min-width: auto;
              }
              
              .buttons {
                flex-direction: column;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📄 Contenido del Ticket ARELY Z SALON</h1>
              <p>Listo para imprimir en impresora térmica</p>
            </div>
            
            <div class="content">
              <div class="instructions">
                <h3>📋 Instrucciones para Android:</h3>
                <ol>
                  <li><strong>Opción recomendada:</strong> Haz clic en "Abrir en rawbt" si tienes la app instalada</li>
                  <li><strong>Opción alternativa:</strong> Copia el contenido y pégalo en tu app de impresión térmica</li>
                  <li><strong>Para imprimir:</strong> Asegúrate de que tu impresora Bluetooth esté emparejada</li>
                  <li><strong>Configuración:</strong> Usa fuente "Courier New" tamaño 8-10pt</li>
                </ol>
              </div>
              
              <div class="device-info">
                📱 Dispositivo: Android - Método: Bluetooth (rawbt)
              </div>
              
              <h3 style="color: #374151; margin: 20px 0 10px 0; font-size: 18px;">
                Contenido del Ticket:
              </h3>
              
              <div class="ticket-content" id="ticketContent">
                ${contenido.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>').replace(/ /g, '&nbsp;')}
              </div>
              
              <div class="buttons">
                <button class="btn btn-rawbt" onclick="abrirRawbt()">
                  <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Abrir en rawbt
                </button>
                
                <button class="btn btn-copy" onclick="copiarContenido()">
                  <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copiar Contenido
                </button>
                
                <button class="btn btn-print" onclick="window.print()">
                  <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Imprimir Página
                </button>
                
                <button class="btn btn-close" onclick="window.close()">
                  <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cerrar Ventana
                </button>
              </div>
            </div>
          </div>
          
          <script>
            const contenidoTicket = \`${contenido.replace(/`/g, '\\`')}\`
            
            function abrirRawbt() {
              const encoded = encodeURIComponent(contenidoTicket)
              window.location.href = 'rawbt:' + encoded
            }
            
            function copiarContenido() {
              navigator.clipboard.writeText(contenidoTicket)
                .then(() => {
                  alert('✅ Contenido copiado al portapapeles')
                })
                .catch(err => {
                  console.error('Error al copiar:', err)
                  alert('❌ Error al copiar: ' + err.message)
                  
                  const textarea = document.createElement('textarea')
                  textarea.value = contenidoTicket
                  document.body.appendChild(textarea)
                  textarea.select()
                  document.execCommand('copy')
                  document.body.removeChild(textarea)
                  alert('✅ Contenido copiado (método alternativo)')
                })
            }
            
            window.addEventListener('beforeprint', () => {
              document.querySelector('.ticket-content').style.fontSize = '9pt'
            })
            
            window.addEventListener('afterprint', () => {
              document.querySelector('.ticket-content').style.fontSize = '12px'
            })
          </script>
        </body>
      </html>
    `)
    ventana.document.close()
  }

  // ==============================================
  // FUNCIONES DE MODALES
  // ==============================================

  const abrirModalNueva = () => {
    setNuevaVenta({
      producto_id: '',
      cantidad: 1,
      precio_unitario: 0,
      total: 0
    })
    setModalNuevaAbierto(true)
  }

  const abrirModalEditar = (venta) => {
    setVentaSeleccionada(venta)
    setModalEditarAbierto(true)
  }

  const abrirModalEliminar = (venta) => {
    setVentaSeleccionada(venta)
    setModalEliminarAbierto(true)
  }

  const cerrarModales = () => {
    setModalNuevaAbierto(false)
    setModalEditarAbierto(false)
    setModalEliminarAbierto(false)
    setVentaSeleccionada(null)
  }

  const handleVentaRegistrada = async (ventaData) => {
    try {
      const { data, error } = await supabase
        .from('ventas')
        .insert([ventaData])
        .select()
      
      if (error) throw error
      
      alert('✅ Venta registrada correctamente')
      cerrarModales()
      cargarDatos()
    } catch (error) {
      console.error('Error:', error)
      alert(`❌ Error: ${error.message}`)
    }
  }

  const handleVentaEditada = async (datosActualizados) => {
    try {
      const { error } = await supabase
        .from('ventas')
        .update(datosActualizados)
        .eq('id', ventaSeleccionada.id)
      
      if (error) throw error
      
      alert('✅ Venta actualizada correctamente')
      cerrarModales()
      cargarDatos()
    } catch (error) {
      console.error('Error:', error)
      alert(`❌ Error: ${error.message}`)
    }
  }

  const handleVentaEliminada = async () => {
    try {
      const { error } = await supabase
        .from('ventas')
        .delete()
        .eq('id', ventaSeleccionada.id)
      
      if (error) throw error
      
      alert('✅ Venta eliminada correctamente')
      cerrarModales()
      cargarDatos()
    } catch (error) {
      console.error('Error:', error)
      alert(`❌ Error: ${error.message}`)
    }
  }

  // ==============================================
  // RENDERIZADO
  // ==============================================

  return (
    <div className="ventas-container">
      <div className="ventas-header">
        <div className="ventas-titulo-container">
          <h1 className="ventas-titulo">Ventas</h1>
          <p className="ventas-subtitulo">ARELY Z SALON - Gestión de Ventas</p>
        </div>
        
        <div className="ventas-botones-header">
          <button
            onClick={abrirModalNueva}
            className="boton-agregar-venta"
          >
            <svg 
              className="boton-agregar-icono" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              width="20"
              height="20"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2.5} 
                d="M12 4v16m8-8H4" 
              />
            </svg>
            Nueva Venta
          </button>
        </div>
      </div>

      {errorCarga && (
        <div className="error-carga">
          <p>{errorCarga}</p>
          <button onClick={cargarDatos} className="btn-reintentar">
            Reintentar
          </button>
        </div>
      )}

      <div className="modo-impresion-indicator">
        <span className="modo-badge modo-bluetooth">
          📱 Android - rawbt
        </span>
        {imprimiendo && (
          <span className="imprimiendo-badge">
            ⚡ Enviando a impresora...
          </span>
        )}
      </div>

      <TablaVentas
        ventas={ventas}
        loading={loading}
        onEditar={abrirModalEditar}
        onEliminar={abrirModalEliminar}
        onImprimir={imprimirTicket}
        imprimiendo={imprimiendo}
      />

      {modalNuevaAbierto && (
  <ModalNuevaVenta
    isOpen={modalNuevaAbierto}
    onClose={cerrarModales}
    onSave={handleVentaRegistrada}
    productos={productos}
    servicios={servicios}  // ✅ AÑADIR ESTA LÍNEA
    ventaData={nuevaVenta}
    setVentaData={setNuevaVenta}
  />
)}

{modalEditarAbierto && ventaSeleccionada && (
  <ModalEditarVenta
    isOpen={modalEditarAbierto}
    onClose={cerrarModales}
    onSave={handleVentaEditada}
    venta={ventaSeleccionada}
    productos={productos}
    servicios={servicios}  // ✅ AÑADIR ESTA LÍNEA
  />
)}
      {modalEliminarAbierto && ventaSeleccionada && (
        <ModalEliminarVenta
          isOpen={modalEliminarAbierto}
          onClose={cerrarModales}
          onConfirm={handleVentaEliminada}
          venta={ventaSeleccionada}
        />
      )}
    </div>
  )
}

export default Ventas