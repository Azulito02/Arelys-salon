// Ventas.jsx
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
  
  // Estados para datos de formularios
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

  const cargarDatos = async () => {
    try {
      setLoading(true)
      setErrorCarga('')
      
      console.log('Iniciando carga de datos de ventas...')
      
      // Cargar productos para el select
      const { data: productosData, error: errorProductos } = await supabase
        .from('productos')
        .select('*')
        .order('nombre')
      
      console.log('Productos cargados:', productosData)
      
      if (errorProductos) {
        console.error('Error cargando productos:', errorProductos)
        throw errorProductos
      }
      setProductos(productosData || [])
      
      // Cargar ventas con información de productos
      const { data: ventasData, error: errorVentas } = await supabase
        .from('ventas')
        .select('*')
        .order('fecha', { ascending: false })
      
      console.log('Ventas cargadas:', ventasData)
      
      if (errorVentas) {
        console.error('Error cargando ventas:', errorVentas)
        throw errorVentas
      }
      
      // Combinar con información de productos
      const ventasConProductos = ventasData.map(venta => {
        const producto = productosData?.find(p => p.id === venta.producto_id)
        return {
          ...venta,
          productos: producto || null
        }
      })
      
      setVentas(ventasConProductos || [])
      
    } catch (error) {
      console.error('Error cargando ventas:', error)
      setErrorCarga(`Error al cargar datos: ${error.message}`)
      alert('Error al cargar datos de ventas')
    } finally {
      setLoading(false)
    }
  }

  // ==============================================
  // FUNCIONES DE IMPRESIÓN CON rawbt
  // ==============================================

  // Formatear fecha para Nicaragua (resta 6 horas)
  const formatFechaNicaragua = (fechaISO) => {
    if (!fechaISO) return 'Fecha no disponible';
    
    const fechaUTC = new Date(fechaISO);
    // RESTAR 6 horas para convertir UTC a Nicaragua (Juigalpa)
    const fechaNicaragua = new Date(fechaUTC.getTime() - (6 * 60 * 60 * 1000));
    
    const dia = fechaNicaragua.getDate().toString().padStart(2, '0');
    const mes = (fechaNicaragua.getMonth() + 1).toString().padStart(2, '0');
    const año = fechaNicaragua.getFullYear();
    
    let horas = fechaNicaragua.getHours();
    const minutos = fechaNicaragua.getMinutes().toString().padStart(2, '0');
    const ampm = horas >= 12 ? 'p.m.' : 'a.m.';
    
    horas = horas % 12;
    horas = horas ? horas.toString().padStart(2, '0') : '12';
    
    return `${dia}/${mes}/${año}, ${horas}:${minutos} ${ampm}`;
  };

  // Formatear fecha simple para tickets
  const formatFechaTicket = (fechaISO) => {
    if (!fechaISO) return '';
    
    const fechaUTC = new Date(fechaISO);
    const fechaNicaragua = new Date(fechaUTC.getTime() - (6 * 60 * 60 * 1000));
    
    const dia = fechaNicaragua.getDate().toString().padStart(2, '0');
    const mes = (fechaNicaragua.getMonth() + 1).toString().padStart(2, '0');
    const año = fechaNicaragua.getFullYear().toString().slice(-2);
    
    let horas = fechaNicaragua.getHours();
    const minutos = fechaNicaragua.getMinutes().toString().padStart(2, '0');
    
    horas = horas % 12;
    horas = horas ? horas.toString().padStart(2, '0') : '12';
    const ampm = fechaNicaragua.getHours() >= 12 ? 'PM' : 'AM';
    
    return `${dia}/${mes}/${año} ${horas}:${minutos} ${ampm}`;
  };

  // Función principal para imprimir una venta
  const imprimirVenta = (venta) => {
    try {
      setImprimiendo(true);
      
      // Generar el contenido del ticket usando tu formato
      const contenido = generarTicketVenta(venta);
      
      // Codificar para rawbt
      const encoded = encodeURIComponent(contenido);
      
      // Abrir en rawbt (para Bluetooth) o imprimir directamente (para USB)
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Modo móvil: usar rawbt para Bluetooth
        window.location.href = `rawbt:${encoded}`;
        console.log('Enviando a rawbt para impresión Bluetooth');
      } else {
        // Modo escritorio: intentar WebUSB o mostrar contenido
        imprimirUSB(contenido);
      }
      
      // Mostrar mensaje de éxito
      setTimeout(() => {
        alert('✅ Ticket enviado a la impresora');
        setImprimiendo(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error al imprimir:', error);
      alert(`❌ Error al imprimir: ${error.message}`);
      setImprimiendo(false);
    }
  };

  // Función para imprimir resumen del día
  const imprimirResumenDia = () => {
    try {
      setImprimiendo(true);
      
      // Filtrar ventas del día actual
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      const ventasHoy = ventas.filter(venta => {
        const fechaVenta = new Date(venta.fecha);
        return fechaVenta >= hoy;
      });
      
      if (ventasHoy.length === 0) {
        alert('⚠️ No hay ventas hoy para imprimir resumen');
        setImprimiendo(false);
        return;
      }
      
      // Generar contenido del resumen
      const contenido = generarResumenDia(ventasHoy);
      
      // Codificar para rawbt
      const encoded = encodeURIComponent(contenido);
      
      // Abrir en rawbt (para Bluetooth) o imprimir directamente (para USB)
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Modo móvil: usar rawbt para Bluetooth
        window.location.href = `rawbt:${encoded}`;
        console.log('Enviando resumen a rawbt');
      } else {
        // Modo escritorio
        imprimirUSB(contenido);
      }
      
      // Mostrar mensaje de éxito
      setTimeout(() => {
        alert('✅ Resumen del día enviado a la impresora');
        setImprimiendo(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error al imprimir resumen:', error);
      alert(`❌ Error al imprimir: ${error.message}`);
      setImprimiendo(false);
    }
  };

  // Generar ticket para una venta específica
  const generarTicketVenta = (venta) => {
    const nombreProducto = venta.productos?.nombre || 'Producto';
    const fechaFormateada = formatFechaTicket(venta.fecha);
    const totalVenta = venta.total?.toFixed(2) || '0.00';
    
    // Método de pago con detalles
    let metodoPagoTexto = '';
    if (venta.metodo_pago === 'efectivo') {
      metodoPagoTexto = `EFECTIVO: $${venta.efectivo?.toFixed(2) || totalVenta}`;
    } else if (venta.metodo_pago === 'tarjeta') {
      metodoPagoTexto = `TARJETA: $${venta.tarjeta?.toFixed(2) || totalVenta}`;
      if (venta.banco) metodoPagoTexto += ` (${venta.banco})`;
    } else if (venta.metodo_pago === 'transferencia') {
      metodoPagoTexto = `TRANSFERENCIA: $${venta.transferencia?.toFixed(2) || totalVenta}`;
      if (venta.banco) metodoPagoTexto += ` (${venta.banco})`;
    } else if (venta.metodo_pago === 'mixto') {
      metodoPagoTexto = 'PAGO MIXTO:\n';
      if (venta.efectivo > 0) metodoPagoTexto += `- Efectivo: $${venta.efectivo?.toFixed(2)}\n`;
      if (venta.tarjeta > 0) metodoPagoTexto += `- Tarjeta: $${venta.tarjeta?.toFixed(2)}\n`;
      if (venta.transferencia > 0) metodoPagoTexto += `- Transferencia: $${venta.transferencia?.toFixed(2)}`;
    } else {
      metodoPagoTexto = 'NO ESPECIFICADO';
    }
    
    // Generar el ticket con formato térmico
    const ticket = `
${centrarTexto("TIENDA EJEMPLO")}
${centrarTexto("====================")}
${centrarTexto("TICKET DE VENTA")}
${centrarTexto("====================")}

Fecha: ${fechaFormateada}
Ticket #: ${venta.id || 'N/A'}
--------------------------------
PRODUCTO:
${nombreProducto}
--------------------------------
Cantidad: ${venta.cantidad || 1} x $${venta.precio_unitario?.toFixed(2) || '0.00'}
--------------------------------
${alinearDerecha(`TOTAL: $${totalVenta}`)}
--------------------------------
METODO DE PAGO:
${metodoPagoTexto}
--------------------------------
${centrarTexto("¡GRACIAS POR SU COMPRA!")}
${centrarTexto("Tel: 1234-5678")}
${centrarTexto("www.tienda.com")}

${centrarTexto("--- CORTE AUTOMÁTICO ---")}
`;
    
    return ticket;
  };

  // Generar resumen del día
  const generarResumenDia = (ventasHoy) => {
    // Calcular estadísticas
    const totalVentas = ventasHoy.reduce((sum, v) => sum + v.total, 0);
    const totalUnidades = ventasHoy.reduce((sum, v) => sum + v.cantidad, 0);
    const totalEfectivo = ventasHoy
      .filter(v => v.metodo_pago === 'efectivo' || v.metodo_pago === 'mixto')
      .reduce((sum, v) => sum + (v.efectivo || 0), 0);
    const totalTarjeta = ventasHoy
      .filter(v => v.metodo_pago === 'tarjeta' || v.metodo_pago === 'mixto')
      .reduce((sum, v) => sum + (v.tarjeta || 0), 0);
    const totalTransferencia = ventasHoy
      .filter(v => v.metodo_pago === 'transferencia' || v.metodo_pago === 'mixto')
      .reduce((sum, v) => sum + (v.transferencia || 0), 0);
    
    const fechaActual = new Date();
    const fechaFormateada = formatFechaTicket(fechaActual.toISOString());
    
    const resumen = `
${centrarTexto("RESUMEN DEL DÍA")}
${centrarTexto("====================")}
Fecha: ${fechaFormateada}
Total Transacciones: ${ventasHoy.length}
--------------------------------
ESTADÍSTICAS:
Total Ventas: $${totalVentas.toFixed(2)}
Total Unidades: ${totalUnidades}
--------------------------------
DISTRIBUCIÓN POR PAGO:
Efectivo: $${totalEfectivo.toFixed(2)}
Tarjeta: $${totalTarjeta.toFixed(2)}
Transferencia: $${totalTransferencia.toFixed(2)}
--------------------------------
LISTA DE VENTAS:
${ventasHoy.map((v, i) => 
  `${i + 1}. ${v.productos?.nombre || 'Producto'} - $${v.total.toFixed(2)}`
).join('\n')}
--------------------------------
${centrarTexto("FIN DEL RESUMEN")}
${centrarTexto(`Generado: ${new Date().toLocaleTimeString()}`)}

${centrarTexto("--- CORTE AUTOMÁTICO ---")}
`;
    
    return resumen;
  };

  // Función auxiliar para centrar texto (40 caracteres de ancho)
  const centrarTexto = (texto) => {
    const ancho = 40;
    const espacios = Math.max(0, Math.floor((ancho - texto.length) / 2));
    return ' '.repeat(espacios) + texto;
  };

  // Función auxiliar para alinear a la derecha
  const alinearDerecha = (texto) => {
    const ancho = 40;
    const espacios = Math.max(0, ancho - texto.length);
    return ' '.repeat(espacios) + texto;
  };

  // Función para imprimir por USB (computadora)
  const imprimirUSB = (contenido) => {
    // Para computadoras, podemos usar WebUSB o mostrar el contenido
    console.log('Contenido para imprimir:', contenido);
    
    // Opción 1: Intentar WebUSB
    if (navigator.usb) {
      console.log('WebUSB disponible, intentando conectar...');
      // Aquí iría la lógica de WebUSB
    }
    
    // Opción 2: Mostrar en una ventana para copiar/pegar
    const ventanaImpresion = window.open('', '_blank');
    ventanaImpresion.document.write(`
      <html>
        <head>
          <title>Contenido para Imprimir</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              white-space: pre;
              padding: 20px;
              background: #f5f5f5;
            }
            .contenido {
              background: white;
              padding: 20px;
              border: 1px solid #ddd;
              max-width: 400px;
              margin: 0 auto;
            }
            .botones {
              margin-top: 20px;
              text-align: center;
            }
            button {
              padding: 10px 20px;
              margin: 0 10px;
              cursor: pointer;
            }
          </style>
        </head>
        <body>
          <div class="contenido">
            ${contenido.replace(/\n/g, '<br>').replace(/ /g, '&nbsp;')}
          </div>
          <div class="botones">
            <button onclick="window.print()">🖨️ Imprimir</button>
            <button onclick="window.close()">Cerrar</button>
          </div>
        </body>
      </html>
    `);
    ventanaImpresion.document.close();
  };

  // ==============================================
  // FUNCIONES EXISTENTES
  // ==============================================

  // Funciones para abrir modales
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

  // Función para cerrar todos los modales
  const cerrarModales = () => {
    setModalNuevaAbierto(false)
    setModalEditarAbierto(false)
    setModalEliminarAbierto(false)
    setVentaSeleccionada(null)
  }

  // Función para manejar nueva venta
  const handleVentaRegistrada = async (ventaData) => {
    console.log('Datos de venta a guardar:', ventaData)
    
    try {
      const { data, error } = await supabase
        .from('ventas')
        .insert([ventaData])
        .select()
      
      console.log('Respuesta Supabase:', { data, error })
      
      if (error) {
        console.error('Error detallado:', error)
        throw error
      }
      
      alert('✅ Venta registrada correctamente')
      cerrarModales()
      cargarDatos()
    } catch (error) {
      console.error('Error completo:', error)
      alert(`❌ Error: ${error.message}`)
      throw error
    }
  }

  // Función para manejar venta editada
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
      console.error('Error actualizando venta:', error)
      alert(`❌ Error: ${error.message}`)
      throw error
    }
  }

  // Función para manejar venta eliminada
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
      console.error('Error eliminando venta:', error)
      alert(`❌ Error: ${error.message}`)
      throw error
    }
  }

  // Calcular estadísticas
  const totalVentas = ventas.reduce((sum, venta) => sum + venta.total, 0)
  const totalUnidades = ventas.reduce((sum, venta) => sum + venta.cantidad, 0)
  const ventasEfectivo = ventas.filter(v => v.metodo_pago === 'efectivo' || v.metodo_pago === 'mixto')
    .reduce((sum, venta) => sum + (venta.efectivo || 0), 0)
  const ventasTarjeta = ventas.filter(v => v.metodo_pago === 'tarjeta' || v.metodo_pago === 'mixto')
    .reduce((sum, venta) => sum + (venta.tarjeta || 0), 0)
  const ventasTransferencia = ventas.filter(v => v.metodo_pago === 'transferencia' || v.metodo_pago === 'mixto')
    .reduce((sum, venta) => sum + (venta.transferencia || 0), 0)

  return (
    <div className="ventas-container">
      <div className="ventas-header">
        <div className="ventas-titulo-container">
          <h1 className="ventas-titulo">Ventas</h1>
          <p className="ventas-subtitulo">Registro de ventas de productos</p>
        </div>
        
        <div className="ventas-botones-header">
          {/* Botón para imprimir resumen del día */}
          <button
            onClick={imprimirResumenDia}
            disabled={imprimiendo || ventas.length === 0}
            className="boton-imprimir-resumen"
          >
            {imprimiendo ? (
              <>
                <span className="spinner-mini"></span>
                Imprimiendo...
              </>
            ) : (
              <>
                <svg className="boton-imprimir-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimir Resumen
              </>
            )}
          </button>
          
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

      {/* Indicador de modo de impresión */}
      <div className="modo-impresion-indicator">
        <span className={`modo-badge ${/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'modo-bluetooth' : 'modo-usb'}`}>
          {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? '📱 Bluetooth (rawbt)' : '💻 USB/Cable'}
        </span>
        {imprimiendo && (
          <span className="imprimiendo-badge">
            ⚡ Imprimiendo...
          </span>
        )}
      </div>

      <TablaVentas
        ventas={ventas}
        loading={loading}
        onEditar={abrirModalEditar}
        onEliminar={abrirModalEliminar}
        onImprimir={imprimirVenta}
        imprimiendo={imprimiendo}
      />

      {/* Resumen de ventas */}
      {!loading && ventas.length > 0 && (
        <div className="resumen-ventas">
          <div className="resumen-card">
            <h3 className="resumen-titulo">Resumen de Ventas</h3>
            <div className="resumen-stats">
              <div className="stat-item">
                <span className="stat-label">Total Ventas:</span>
                <span className="stat-value">${totalVentas.toFixed(2)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Unidades Vendidas:</span>
                <span className="stat-value">{totalUnidades} unidades</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Transacciones:</span>
                <span className="stat-value">{ventas.length} registros</span>
              </div>
            </div>
            
            <div className="separador"></div>
            
            <h4 className="resumen-subtitulo">Distribución por Método de Pago:</h4>
            <div className="resumen-stats-metodos">
              <div className="stat-metodo-item">
                <span className="stat-metodo-label">💰 Efectivo:</span>
                <span className="stat-metodo-valor">${ventasEfectivo.toFixed(2)}</span>
              </div>
              <div className="stat-metodo-item">
                <span className="stat-metodo-label">💳 Tarjeta:</span>
                <span className="stat-metodo-valor">${ventasTarjeta.toFixed(2)}</span>
              </div>
              <div className="stat-metodo-item">
                <span className="stat-metodo-label">🏦 Transferencia:</span>
                <span className="stat-metodo-valor">${ventasTransferencia.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modales */}
      <ModalNuevaVenta
        isOpen={modalNuevaAbierto}
        onClose={cerrarModales}
        onSave={handleVentaRegistrada}
        productos={productos}
        ventaData={nuevaVenta}
        setVentaData={setNuevaVenta}
      />

      <ModalEditarVenta
        isOpen={modalEditarAbierto}
        onClose={cerrarModales}
        onSave={handleVentaEditada}
        venta={ventaSeleccionada}
        productos={productos}
      />

      <ModalEliminarVenta
        isOpen={modalEliminarAbierto}
        onClose={cerrarModales}
        onConfirm={handleVentaEliminada}
        venta={ventaSeleccionada}
      />
    </div>
  )
}

export default Ventas