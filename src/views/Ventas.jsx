// Ventas.jsx - VERSIÓN CORREGIDA PARA TU BASE DE DATOS
import { useState, useEffect } from 'react'
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
  const [loading, setLoading] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  const [imprimiendo, setImprimiendo] = useState(false)
  
  // Estados para modales
  const [modalNuevaAbierto, setModalNuevaAbierto] = useState(false)
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false)
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false)
  
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
  }, [])

  // ==============================================
  // CARGAR DATOS - VERSIÓN CORREGIDA
  // ==============================================

  const cargarDatos = async () => {
    try {
      setLoading(true)
      setErrorCarga('')
      
      // Cargar productos
      const { data: productosData, error: errorProductos } = await supabase
        .from('productos')
        .select('*')
        .order('nombre')
      
      if (errorProductos) throw errorProductos
      setProductos(productosData || [])
      
      // Cargar ventas CON productos (tu estructura)
      const { data: ventasData, error: errorVentas } = await supabase
        .from('ventas')
        .select(`
          *,
          productos (*)
        `)
        .order('fecha', { ascending: false })  // Cambié fecha_hora por fecha
      
      if (errorVentas) throw errorVentas
      setVentas(ventasData || [])
      
    } catch (error) {
      console.error('Error cargando ventas:', error)
      setErrorCarga(`Error al cargar datos: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // ==============================================
  // FUNCIÓN DE IMPRESIÓN - VERSIÓN CORREGIDA
  // ==============================================

  const imprimirTicket = (venta) => {
    try {
      setImprimiendo(true)
      
      // Validar que rawbt esté disponible
      const isAndroid = /Android/.test(navigator.userAgent)
      if (!isAndroid) {
        alert('⚠️ Esta función solo está disponible en dispositivos Android')
        setImprimiendo(false)
        return
      }
      
      // Generar el contenido del ticket
      const contenido = generarContenidoTicket(venta)
      
      // Codificar y enviar a rawbt
      const encoded = encodeURIComponent(contenido)
      window.location.href = `rawbt:${encoded}`
      
      // Fallback si rawbt no está instalado
      setTimeout(() => {
        if (!document.hidden) {
          mostrarContenidoParaCopiar(contenido)
        }
      }, 1500)
      
      // Resetear estado después de 2 segundos
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
  // GENERAR CONTENIDO DEL TICKET - VERSIÓN CORREGIDA
  // ==============================================

  const generarContenidoTicket = (venta) => {
    // 1. Nombre del cliente (EN TU SISTEMA NO HAY CLIENTES)
    const nombreMostrar = "Cliente de Mostrador"  // Default ya que no hay tabla clientes

    // 2. Fecha formateada (usar fecha en lugar de fecha_hora)
    const fecha = venta.fecha 
      ? new Date(venta.fecha).toLocaleString("es-NI", { 
          year: "2-digit", 
          month: "2-digit", 
          day: "2-digit", 
          hour: "2-digit", 
          minute: "2-digit" 
        })
      : ""

    // 3. Información del producto
    const nombreProducto = venta.productos?.nombre || "Producto"
    const cantidad = venta.cantidad || 0
    const precioUnitario = Number(venta.precio_unitario || 0).toFixed(2)
    const totalVenta = Number(venta.total || 0)

    // 4. Detalle del ticket
    let detalleTexto = "DETALLE DE VENTA:\n"
    detalleTexto += "=".repeat(32) + "\n"
    detalleTexto += `${nombreProducto}\n`
    detalleTexto += `Cantidad: ${cantidad} x C$${precioUnitario}\n`
    detalleTexto += "=".repeat(32) + "\n"

    // 5. Cálculos financieros
    const iva = totalVenta * 0.15 // 15% de IVA
    const subtotal = totalVenta - iva
    const numeroVenta = venta.id || "-"
    
    // Método de pago según tu estructura
    let metodoPago = venta.metodo_pago || "No especificado"
    if (venta.metodo_pago && venta.efectivo > 0 && venta.tarjeta > 0 && venta.transferencia > 0) {
      metodoPago = "Mixto"
    } else if (venta.efectivo > 0) {
      metodoPago = "Efectivo"
    } else if (venta.tarjeta > 0) {
      metodoPago = "Tarjeta"
    } else if (venta.transferencia > 0) {
      metodoPago = "Transferencia"
    }

    // 6. Construir ticket completo
    const anchoLinea = 40
    const centrar = (texto) => {
      const espacios = Math.max(0, Math.floor((anchoLinea - texto.length) / 2))
      return ' '.repeat(espacios) + texto
    }

    const alinearDerecha = (texto, etiqueta) => {
      const espacio = anchoLinea - etiqueta.length - texto.length
      return etiqueta + ' '.repeat(Math.max(1, espacio)) + texto
    }

    const ticket = `
${centrar("ARELY Z SALON")}
${centrar("=".repeat(20))}
${centrar("TICKET DE VENTA")}
${centrar("=".repeat(20))}

${centrar(`#${numeroVenta}`)}
${centrar(fecha)}

CLIENTE: ${nombreMostrar}
${"-".repeat(anchoLinea)}

${detalleTexto}
${alinearDerecha(`C$${subtotal.toFixed(2)}`, "SUBTOTAL:")}
${alinearDerecha(`C$${iva.toFixed(2)}`, "IVA 15%:")}
${alinearDerecha(`C$${totalVenta.toFixed(2)}`, "TOTAL:")}

${"-".repeat(anchoLinea)}
PRODUCTO: ${nombreProducto}
CANTIDAD: ${cantidad}
PRECIO: C$${precioUnitario}
${"-".repeat(anchoLinea)}

MÉTODO PAGO: ${metodoPago.toUpperCase()}
${venta.banco ? `BANCO: ${venta.banco}` : ""}
${"-".repeat(anchoLinea)}

${centrar("¡GRACIAS POR SU COMPRA!")}
${centrar("Tel: 1234-5678")}
${centrar("arelyz-salon.com")}

${centrar("=".repeat(20))}
${centrar("CORTE AUTOMÁTICO")}
${centrar("=".repeat(20))}
`

    return ticket.trim()
  }

  // ==============================================
  // FALLBACK PARA COPIAR CONTENIDO (MANTENER IGUAL)
  // ==============================================

  const mostrarContenidoParaCopiar = (contenido) => {
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
                  
                  // Fallback para navegadores antiguos
                  const textarea = document.createElement('textarea')
                  textarea.value = contenidoTicket
                  document.body.appendChild(textarea)
                  textarea.select()
                  document.execCommand('copy')
                  document.body.removeChild(textarea)
                  alert('✅ Contenido copiado (método alternativo)')
                })
            }
            
            // Configurar impresión térmica
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
  // FUNCIONES DE MODALES (MANTENER IGUAL)
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
  // RENDERIZADO - VERSIÓN CORREGIDA
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

      {/* Indicador Android */}
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

      {/* Tabla de ventas */}
      <TablaVentas
        ventas={ventas}
        loading={loading}
        onEditar={abrirModalEditar}
        onEliminar={abrirModalEliminar}
        onImprimir={imprimirTicket}
        imprimiendo={imprimiendo}
      />

      {/* Modales */}
      {modalNuevaAbierto && (
        <ModalNuevaVenta
          isOpen={modalNuevaAbierto}
          onClose={cerrarModales}
          onSave={handleVentaRegistrada}
          productos={productos}
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