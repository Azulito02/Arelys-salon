import React, { useState, useEffect } from 'react'
import './ModalNuevaVenta.css'

const ModalNuevaVenta = ({
  isOpen,
  onClose,
  onSave,
  productos,
  servicios = [] // ✅ NUEVO: servicios
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Combinar productos y servicios para búsquedas
  const [itemsDisponibles, setItemsDisponibles] = useState([])
  
  useEffect(() => {
    // Combinar productos y servicios cuando cambien
    const combinados = [
      ...(productos || []).map(p => ({ ...p, tipo: 'producto' })),
      ...(servicios || []).map(s => ({ ...s, tipo: 'servicio' }))
    ]
    setItemsDisponibles(combinados)
  }, [productos, servicios])
  
  // Estado para búsqueda de productos principal
  const [busqueda, setBusqueda] = useState('')
  const [itemsFiltrados, setItemsFiltrados] = useState([])
  const [mostrarResultados, setMostrarResultados] = useState(false)
  
  // Estado para búsqueda manual en productos agregados
  const [busquedaManual, setBusquedaManual] = useState('')
  const [itemsFiltradosManual, setItemsFiltradosManual] = useState([])
  const [mostrarResultadosManual, setMostrarResultadosManual] = useState(false)
  const [indiceBuscando, setIndiceBuscando] = useState(null)
  
  // Lista de productos seleccionados
  const [productosSeleccionados, setProductosSeleccionados] = useState([])
  
  // Métodos de pago y bancos
  const metodosPago = [
    { value: 'efectivo', label: 'Efectivo', icon: '💰' },
    { value: 'tarjeta', label: 'Tarjeta', icon: '💳' },
    { value: 'transferencia', label: 'Transferencia', icon: '🏦' },
    { value: 'mixto', label: 'Mixto', icon: '🔄' }
  ]

  const bancosDisponibles = [
    'Lafise',
    'BAC',
    'BAMPRO',
    'Avanz',
    'BDF',
    'Fichosa',
    'Otro'
  ]

  // Estado para métodos de pago
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [banco, setBanco] = useState('')
  const [efectivo, setEfectivo] = useState(0)
  const [tarjeta, setTarjeta] = useState(0)
  const [transferencia, setTransferencia] = useState(0)
  const [vuelto, setVuelto] = useState(0)

  // Estado para banco específico en método mixto
  const [bancoTarjeta, setBancoTarjeta] = useState('')
  const [bancoTransferencia, setBancoTransferencia] = useState('')

  // Resetear datos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setError('')
      setMetodoPago('efectivo')
      setBanco('')
      setEfectivo(0)
      setTarjeta(0)
      setTransferencia(0)
      setBancoTarjeta('')
      setBancoTransferencia('')
      setVuelto(0)
      setBusqueda('')
      setItemsFiltrados([])
      setMostrarResultados(false)
      setProductosSeleccionados([])
      setBusquedaManual('')
      setItemsFiltradosManual([])
      setMostrarResultadosManual(false)
      setIndiceBuscando(null)
    }
  }, [isOpen])

  // Filtrar items según búsqueda principal
  useEffect(() => {
    if (busqueda.trim() === '') {
      setItemsFiltrados([])
      setMostrarResultados(false)
      return
    }

    const termino = busqueda.toLowerCase().trim()
    
    const filtrados = itemsDisponibles.filter(item => {
      if (item.nombre?.toLowerCase().includes(termino)) return true
      if (item.categoria?.toLowerCase().includes(termino)) return true
      if (item.codigo_barras?.toLowerCase().includes(termino)) return true
      return false
    })
    
    setItemsFiltrados(filtrados)
    setMostrarResultados(true)
  }, [busqueda, itemsDisponibles])

  // Filtrar items según búsqueda manual
  useEffect(() => {
    if (busquedaManual.trim() === '' || indiceBuscando === null) {
      setItemsFiltradosManual([])
      setMostrarResultadosManual(false)
      return
    }

    const termino = busquedaManual.toLowerCase().trim()
    
    const filtrados = itemsDisponibles.filter(item => {
      if (item.nombre?.toLowerCase().includes(termino)) return true
      if (item.categoria?.toLowerCase().includes(termino)) return true
      if (item.codigo_barras?.toLowerCase().includes(termino)) return true
      return false
    })
    
    setItemsFiltradosManual(filtrados)
    setMostrarResultadosManual(true)
  }, [busquedaManual, itemsDisponibles, indiceBuscando])

  // Agregar item desde búsqueda principal
  const agregarItemDesdeBusqueda = (item) => {
    console.log('🔍 Item recibido para agregar:', item)
    
    const existeIndex = productosSeleccionados.findIndex(p => p.item_id === item.id)
    const precioItem = obtenerPrecioItem(item)
    
    if (existeIndex !== -1) {
      setProductosSeleccionados(prev =>
        prev.map((p, idx) =>
          idx === existeIndex
            ? { 
                ...p, 
                cantidad: p.cantidad + 1,
                precio_unitario: precioItem > 0 ? precioItem : p.precio_unitario
              }
            : p
        )
      )
    } else {
      const nuevoItem = {
        id: Date.now() + Math.random(),
        item_id: item.id,
        tipo: item.tipo,
        cantidad: 1,
        precio_unitario: precioItem,
        item_nombre: item.nombre,
        item_categoria: item.categoria || (item.tipo === 'servicio' ? 'Servicio' : ''),
        item_codigo: item.codigo_barras || item.codigo
      }
      
      setProductosSeleccionados(prev => [...prev, nuevoItem])
    }
    
    setBusqueda('')
    setMostrarResultados(false)
    setError('')
  }

  // Función auxiliar para obtener el precio del item
  const obtenerPrecioItem = (item) => {
    if (item.precio_venta !== undefined && item.precio_venta !== null) {
      return parseFloat(item.precio_venta)
    }
    if (item.precio !== undefined && item.precio !== null) {
      return parseFloat(item.precio)
    }
    if (item.precio_unitario !== undefined && item.precio_unitario !== null) {
      return parseFloat(item.precio_unitario)
    }
    return 0
  }

  // Agregar item manualmente (botón)
  const agregarItemManual = () => {
    const nuevoItem = { 
      id: Date.now() + Math.random(),
      item_id: '', 
      tipo: '',
      cantidad: 1, 
      precio_unitario: 0,
      item_nombre: '',
      item_categoria: '',
      item_codigo: ''
    }
    
    setProductosSeleccionados(prev => [...prev, nuevoItem])
    setIndiceBuscando(productosSeleccionados.length)
    setBusquedaManual('')
  }

  // Eliminar item de la lista
  const eliminarItem = (index) => {
    const nuevosItems = [...productosSeleccionados]
    nuevosItems.splice(index, 1)
    setProductosSeleccionados(nuevosItems)
  }

  // Actualizar item en la lista
  const actualizarItem = (index, campo, valor) => {
    const nuevosItems = [...productosSeleccionados]
    
    if (campo === 'item_id') {
      const item = itemsDisponibles.find(p => p.id === valor)
      if (item) {
        const precioAsignar = obtenerPrecioItem(item)
        nuevosItems[index] = {
          ...nuevosItems[index],
          item_id: valor,
          tipo: item.tipo,
          precio_unitario: precioAsignar,
          item_nombre: item.nombre,
          item_categoria: item.categoria || (item.tipo === 'servicio' ? 'Servicio' : ''),
          item_codigo: item.codigo_barras || item.codigo
        }
      }
    } else if (campo === 'cantidad') {
      const nuevaCantidad = Math.max(1, parseInt(valor) || 1)
      nuevosItems[index] = {
        ...nuevosItems[index],
        cantidad: nuevaCantidad
      }
    } else if (campo === 'precio_unitario') {
      const nuevoPrecio = parseFloat(valor) || 0
      nuevosItems[index] = {
        ...nuevosItems[index],
        precio_unitario: nuevoPrecio
      }
    }
    
    setProductosSeleccionados(nuevosItems)
  }

  // Calcular totales
  const calcularTotalItem = (item) => {
    if (!item) return 0
    const cantidad = parseInt(item.cantidad) || 1
    const precio = parseFloat(item.precio_unitario) || 0
    return cantidad * precio
  }

  const calcularTotalGeneral = () => {
    return productosSeleccionados.reduce((total, item) => {
      return total + calcularTotalItem(item)
    }, 0)
  }

  const totalGeneral = calcularTotalGeneral()
  const totalPagos = efectivo + tarjeta + transferencia
  const diferencia = totalPagos - totalGeneral

  // 🔴 CORREGIDO: Calcular vuelto UNA SOLA VEZ
  useEffect(() => {
    if (diferencia > 0) {
      setVuelto(Math.round(diferencia * 100) / 100)
    } else {
      setVuelto(0)
    }
  }, [diferencia])

  // Manejar cambios en método de pago
  useEffect(() => {
    if (metodoPago === 'efectivo') {
      setEfectivo(totalGeneral)
      setTarjeta(0)
      setTransferencia(0)
      setBanco('')
    } else if (metodoPago === 'tarjeta') {
      setEfectivo(0)
      setTarjeta(totalGeneral)
      setTransferencia(0)
      setBanco('')
    } else if (metodoPago === 'transferencia') {
      setEfectivo(0)
      setTarjeta(0)
      setTransferencia(totalGeneral)
      setBanco('')
    } else if (metodoPago === 'mixto') {
      setEfectivo(totalGeneral)
      setTarjeta(0)
      setTransferencia(0)
      setBancoTarjeta('')
      setBancoTransferencia('')
    }
  }, [metodoPago, totalGeneral])

  // Función para Pago Completo (exacto)
  const handlePagoCompleto = () => {
    if (metodoPago === 'efectivo') {
      setEfectivo(totalGeneral)
    } else if (metodoPago === 'tarjeta') {
      setTarjeta(totalGeneral)
    } else if (metodoPago === 'transferencia') {
      setTransferencia(totalGeneral)
    } else if (metodoPago === 'mixto') {
      setEfectivo(totalGeneral)
      setTarjeta(0)
      setTransferencia(0)
    }
  }

  // Función para Pago Excedente
  const handlePagoConVuelto = (montoRedondo) => {
    if (metodoPago === 'efectivo') {
      const montoAPagar = Math.ceil(totalGeneral / montoRedondo) * montoRedondo
      setEfectivo(montoAPagar)
    }
  }

  // 🔴 CORREGIDO: handleSubmit con MISMO vuelto para TODOS los items
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (productosSeleccionados.length === 0) {
      setError('Agrega al menos un producto o servicio')
      return
    }

    const totalGeneral = calcularTotalGeneral()
    if (totalGeneral <= 0) {
      setError('El total debe ser mayor a 0')
      return
    }

    const itemsInvalidos = productosSeleccionados.filter(p => !p.item_id)
    if (itemsInvalidos.length > 0) {
      setError('Todos los productos/servicios deben estar seleccionados')
      return
    }

    if (totalPagos <= 0) {
      setError('El monto de la venta debe ser mayor a 0')
      return
    }

    if (totalPagos < totalGeneral) {
      setError(`El pago (C$${totalPagos.toFixed(2)}) es menor al total (C$${totalGeneral.toFixed(2)})`)
      return
    }

    if (metodoPago === 'tarjeta' && !banco) {
      setError('Selecciona un banco para pago con tarjeta')
      return
    }

    if (metodoPago === 'transferencia' && !banco) {
      setError('Selecciona un banco para pago con transferencia')
      return
    }

    if (metodoPago === 'mixto') {
      if (tarjeta > 0 && !bancoTarjeta) {
        setError('Selecciona un banco para el pago con tarjeta en método mixto')
        return
      }
      if (transferencia > 0 && !bancoTransferencia) {
        setError('Selecciona un banco para el pago con transferencia en método mixto')
        return
      }
    }

    setLoading(true)
    
    try {
      // 🔴 CORREGIDO: Calcular vuelto UNA SOLA VEZ para TODA la transacción
      const vueltoCalculado = Math.max(0, totalPagos - totalGeneral)
      const vueltoRedondeado = Math.round(vueltoCalculado * 100) / 100

// En lugar de solo producto_id, usar producto_id o servicio_id
const ventas = productosSeleccionados.map(item => {
  const datosVenta = {
    // Si es producto, usar producto_id, si es servicio, usar servicio_id
    ...(item.tipo === 'producto' ? { producto_id: item.item_id } : { servicio_id: item.item_id }),
    cantidad: item.cantidad,
    precio_unitario: item.precio_unitario,
    total: calcularTotalItem(item),
    fecha: new Date().toISOString(),
    metodo_pago: metodoPago,
    tipo_item: item.tipo, // guardamos el tipo para referencia
    efectivo: 0,
    tarjeta: 0,
    transferencia: 0,
    vuelto: vueltoRedondeado
  }

  // Distribuir pagos proporcionalmente
  const proporcion = calcularTotalItem(item) / totalGeneral
  
  if (metodoPago === 'efectivo') {
    datosVenta.efectivo = parseFloat((efectivo * proporcion).toFixed(2))
  } else if (metodoPago === 'tarjeta') {
    datosVenta.tarjeta = parseFloat((tarjeta * proporcion).toFixed(2))
    if (banco) datosVenta.banco = banco
  } else if (metodoPago === 'transferencia') {
    datosVenta.transferencia = parseFloat((transferencia * proporcion).toFixed(2))
    if (banco) datosVenta.banco = banco
  } else if (metodoPago === 'mixto') {
    datosVenta.efectivo = parseFloat((efectivo * proporcion).toFixed(2))
    datosVenta.tarjeta = parseFloat((tarjeta * proporcion).toFixed(2))
    datosVenta.transferencia = parseFloat((transferencia * proporcion).toFixed(2))
    
    const bancosMixto = {
      tarjeta: bancoTarjeta || null,
      transferencia: bancoTransferencia || null
    }
    datosVenta.banco = JSON.stringify(bancosMixto)
  }

  return datosVenta
})      
      console.log('Guardando ventas con vuelto:', vueltoRedondeado, ventas)
      
      // Enviar todas las ventas
      for (const venta of ventas) {
        await onSave(venta)
      }
      
      // Resetear formulario después de guardar
      setProductosSeleccionados([])
      setMetodoPago('efectivo')
      setBanco('')
      setEfectivo(0)
      setTarjeta(0)
      setTransferencia(0)
      setBancoTarjeta('')
      setBancoTransferencia('')
      setVuelto(0)
      setBusqueda('')
      setBusquedaManual('')
      setIndiceBuscando(null)
      
      onClose()
      
    } catch (error) {
      setError('Error al registrar la venta: ' + error.message)
      console.error('Error al registrar:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMetodoSimpleChange = (metodo, value) => {
    const valor = parseFloat(value) || 0
    
    if (metodo === 'efectivo') {
      setEfectivo(valor)
      setTarjeta(0)
      setTransferencia(0)
    } else if (metodo === 'tarjeta') {
      setEfectivo(0)
      setTarjeta(valor)
      setTransferencia(0)
    } else if (metodo === 'transferencia') {
      setEfectivo(0)
      setTarjeta(0)
      setTransferencia(valor)
    }
  }

  // Seleccionar item desde búsqueda manual
  const seleccionarItemManual = (item, index) => {
    const precioAsignar = obtenerPrecioItem(item)
    actualizarItem(index, 'item_id', item.id)
    setBusquedaManual('')
    setMostrarResultadosManual(false)
    setIndiceBuscando(null)
  }

  // Iniciar búsqueda manual para un item específico
  const iniciarBusquedaManual = (index) => {
    setIndiceBuscando(index)
    setBusquedaManual('')
    setItemsFiltradosManual([])
    setMostrarResultadosManual(false)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-container-nueva-venta">
        <div className="modal-header-nueva-venta">
          <div className="modal-titulo-contenedor">
            <svg className="modal-icono-nuevo" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <h3 className="modal-titulo-nueva-venta">
              Nueva Venta
            </h3>
          </div>
          <button
            onClick={onClose}
            className="modal-cerrar-btn"
            disabled={loading}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-contenido-nueva-venta">
            {/* BÚSQUEDA DE PRODUCTOS/SERVICIOS */}
            <div className="form-grupo">
              <label className="form-label">
                Buscar Producto o Servicio
                <span className="hint-text"> (nombre, categoría, código de barras)</span>
              </label>
              <div className="busqueda-producto-container">
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onFocus={() => {
                    if (busqueda.trim()) setMostrarResultados(true)
                  }}
                  className="form-input-busqueda"
                  placeholder="Escribe o escanea código de barras..."
                  disabled={loading}
                  autoFocus
                />
                {busqueda && (
                  <button
                    type="button"
                    onClick={() => {
                      setBusqueda('')
                      setItemsFiltrados([])
                      setMostrarResultados(false)
                    }}
                    className="boton-limpiar-busqueda"
                  >
                    ×
                  </button>
                )}
                
                {/* Resultados de búsqueda */}
                {mostrarResultados && itemsFiltrados.length > 0 && (
                  <div className="resultados-busqueda">
                    {itemsFiltrados.slice(0, 10).map((item) => (
                      <div
                        key={item.id}
                        className="resultado-item"
                        onClick={() => agregarItemDesdeBusqueda(item)}
                      >
                        <div className="resultado-nombre">
                          <strong>{item.nombre}</strong>
                          {item.tipo === 'servicio' && (
                            <span className="resultado-tipo servicio"> 💇 Servicio</span>
                          )}
                          {item.categoria && (
                            <span className="resultado-categoria"> ({item.categoria})</span>
                          )}
                        </div>
                        <div className="resultado-info">
                          <span className="resultado-precio">C${obtenerPrecioItem(item).toFixed(2)}</span>
                          {item.codigo_barras && (
                            <span className="resultado-codigo">📟 {item.codigo_barras}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {mostrarResultados && itemsFiltrados.length === 0 && (
                  <div className="resultados-busqueda">
                    <div className="resultado-vacio">
                      No se encontraron productos/servicios con "{busqueda}"
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* LISTA DE ITEMS SELECCIONADOS */}
            <div className="productos-container">
              <div className="productos-header">
                <h4 className="productos-titulo">Productos/Servicios ({productosSeleccionados.length})</h4>
                <button
                  type="button"
                  onClick={agregarItemManual}
                  className="btn-agregar-producto"
                  disabled={loading}
                >
                  + Agregar
                </button>
              </div>
              
              {productosSeleccionados.length === 0 ? (
                <div className="sin-productos">
                  <p>No hay productos o servicios agregados. Busca o agrega.</p>
                </div>
              ) : (
                <div className="lista-productos">
                  {productosSeleccionados.map((item, index) => (
                    <div key={item.id} className="producto-item">
                      <div className="producto-header">
                        <span className="producto-numero">#{index + 1}</span>
                        {item.tipo === 'servicio' && (
                          <span className="item-tipo-badge servicio">💇 Servicio</span>
                        )}
                        <button
                          type="button"
                          onClick={() => eliminarItem(index)}
                          className="btn-eliminar-producto"
                          disabled={loading}
                        >
                          ×
                        </button>
                      </div>
                      
                      <div className="producto-form">
                        <div className="producto-seleccionado-info">
                          {item.item_nombre ? (
                            <div className="producto-info-actual">
                              <strong>{item.item_nombre}</strong>
                              {item.item_categoria && (
                                <span className="producto-info-categoria"> ({item.item_categoria})</span>
                              )}
                              {item.item_codigo && (
                                <div className="producto-info-codigo">
                                  <small>Código: {item.item_codigo}</small>
                                </div>
                              )}
                              {item.precio_unitario > 0 && (
                                <div className="producto-info-precio">
                                  <small>Precio: C${item.precio_unitario.toFixed(2)}</small>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="producto-busqueda-container">
                              <input
                                type="text"
                                value={indiceBuscando === index ? busquedaManual : ''}
                                onChange={(e) => {
                                  setBusquedaManual(e.target.value)
                                  if (indiceBuscando !== index) {
                                    setIndiceBuscando(index)
                                  }
                                }}
                                onFocus={() => iniciarBusquedaManual(index)}
                                placeholder="Buscar producto/servicio..."
                                className="form-input-busqueda"
                                disabled={loading}
                              />
                              {indiceBuscando === index && mostrarResultadosManual && itemsFiltradosManual.length > 0 && (
                                <div className="resultados-busqueda-manual">
                                  {itemsFiltradosManual.slice(0, 5).map((p) => (
                                    <div
                                      key={p.id}
                                      className="resultado-item"
                                      onClick={() => seleccionarItemManual(p, index)}
                                    >
                                      <div className="resultado-nombre">
                                        <strong>{p.nombre}</strong>
                                        {p.tipo === 'servicio' && (
                                          <span className="resultado-tipo servicio"> 💇</span>
                                        )}
                                      </div>
                                      <div className="resultado-info">
                                        <span className="resultado-precio">C${obtenerPrecioItem(p).toFixed(2)}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="producto-cantidad-precio">
                          <div>
                            <label>Cantidad</label>
                            <div className="input-group-cantidad">
                              <button
                                type="button"
                                onClick={() => actualizarItem(index, 'cantidad', item.cantidad - 1)}
                                className="cantidad-btn"
                                disabled={loading}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.cantidad}
                                onChange={(e) => actualizarItem(index, 'cantidad', e.target.value)}
                                className="form-input-cantidad"
                                disabled={loading || !item.item_id}
                                required
                              />
                              <button
                                type="button"
                                onClick={() => actualizarItem(index, 'cantidad', item.cantidad + 1)}
                                className="cantidad-btn"
                                disabled={loading || !item.item_id}
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div>
                            <label>Precio Unit.</label>
                            <div className="input-group-precio">
                              <span className="precio-simbolo">C$</span>
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={item.precio_unitario}
                                onChange={(e) => actualizarItem(index, 'precio_unitario', e.target.value)}
                                className="form-input-precio"
                                disabled={loading || !item.item_id}
                                required
                              />
                            </div>
                          </div>
                          <div className="producto-subtotal">
                            <label>Subtotal</label>
                            <div className="subtotal-valor">
                              C${calcularTotalItem(item).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* SECCIÓN DE TOTAL */}
            <div className="total-section">
              <div className="total-container">
                <div className="total-info">
                  <div className="total-label-container">
                    <span className="total-label">TOTAL VENTA:</span>
                    <div className="total-calculation">
                      {productosSeleccionados.length} ítems
                    </div>
                  </div>
                  <div className="total-amount-container">
                    <span className="total-amount">C${totalGeneral.toFixed(2)}</span>
                    <div className="pago-buttons-container">
                      <button 
                        type="button" 
                        onClick={handlePagoCompleto}
                        className="btn-pago-completo"
                        disabled={productosSeleccionados.length === 0}
                        title="Establecer el monto exacto del total"
                      >
                        Pago Exacto
                      </button>
                      {metodoPago === 'efectivo' && productosSeleccionados.length > 0 && (
                        <div className="pago-con-vuelto-buttons">
                          <button 
                            type="button" 
                            onClick={() => handlePagoConVuelto(10)}
                            className="btn-pago-vuelto"
                          >
                            Con C$10
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handlePagoConVuelto(50)}
                            className="btn-pago-vuelto"
                          >
                            Con C$50
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handlePagoConVuelto(100)}
                            className="btn-pago-vuelto"
                          >
                            Con C$100
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handlePagoConVuelto(200)}
                            className="btn-pago-vuelto"
                          >
                            Con C$200
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handlePagoConVuelto(500)}
                            className="btn-pago-vuelto"
                          >
                            Con C$500
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handlePagoConVuelto(1000)}
                            className="btn-pago-vuelto"
                          >
                            Con C$1000
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Información de Vuelto */}
                {vuelto > 0 && (
                  <div className="vuelto-section">
                    <div className="vuelto-info">
                      <span className="vuelto-label">VUELTO:</span>
                      <span className="vuelto-amount">C${vuelto.toFixed(2)}</span>
                    </div>
                    <div className="vuelto-detalle">
                      Se pagó C$${totalPagos.toFixed(2)} - Total C$${totalGeneral.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Método de Pago */}
            <div className="form-grupo">
              <label className="form-label">
                Método de Pago **
              </label>
              <div className="metodos-pago-grid">
                {metodosPago.map((metodo) => (
                  <button
                    key={metodo.value}
                    type="button"
                    className={`metodo-pago-btn ${metodoPago === metodo.value ? 'metodo-pago-seleccionado' : ''}`}
                    onClick={() => {
                      setMetodoPago(metodo.value)
                      setError('')
                    }}
                    disabled={loading || productosSeleccionados.length === 0}
                  >
                    <span className="metodo-pago-icono">{metodo.icon}</span>
                    <span className="metodo-pago-label">{metodo.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Para métodos simples */}
            {metodoPago !== 'mixto' && (
              <div className="form-grupo">
                <label className="form-label">
                  Monto Recibido **
                  {metodoPago === 'efectivo' && <span className="hint-text"> (puede ser mayor al total)</span>}
                </label>
                <div className="input-group-precio">
                  <span className="precio-simbolo">C$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={metodoPago === 'efectivo' ? efectivo : 
                           metodoPago === 'tarjeta' ? tarjeta : 
                           transferencia}
                    onChange={(e) => handleMetodoSimpleChange(metodoPago, e.target.value)}
                    className="form-input-precio"
                    placeholder="0.00"
                    disabled={loading || productosSeleccionados.length === 0}
                  />
                </div>
                {metodoPago === 'efectivo' && vuelto > 0 && (
                  <div className="vuelto-mini">
                    <span className="vuelto-mini-label">Vuelto a dar: </span>
                    <span className="vuelto-mini-amount">C$${vuelto.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Banco para tarjeta o transferencia simple */}
            {(metodoPago === 'tarjeta' || metodoPago === 'transferencia') && (
              <div className="form-grupo">
                <label className="form-label">
                  Banco **
                </label>
                <select
                  value={banco}
                  onChange={(e) => {
                    setBanco(e.target.value)
                    setError('')
                  }}
                  className="form-select"
                  disabled={loading || productosSeleccionados.length === 0}
                  required={metodoPago === 'tarjeta' || metodoPago === 'transferencia'}
                >
                  <option value="">Selecciona un banco</option>
                  {bancosDisponibles.map((bancoItem) => (
                    <option key={bancoItem} value={bancoItem}>
                      {bancoItem}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Montos y bancos para método mixto */}
            {metodoPago === 'mixto' && (
              <div className="montos-mixtos-container">
                <h4 className="montos-mixtos-titulo">Distribución del Pago:</h4>
                <div className="montos-mixtos-grid">
                  {/* Efectivo */}
                  <div className="form-grupo">
                    <label className="form-label">
                      <span className="monto-mixto-label-icono">💰</span>
                      Efectivo:
                    </label>
                    <div className="input-group-precio">
                      <span className="precio-simbolo">C$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={efectivo}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0
                          setEfectivo(Math.max(0, value))
                          setError('')
                        }}
                        className="form-input-precio"
                        disabled={loading || productosSeleccionados.length === 0}
                      />
                    </div>
                  </div>
                  
                  {/* Tarjeta con banco */}
                  <div className="form-grupo">
                    <label className="form-label">
                      <span className="monto-mixto-label-icono">💳</span>
                      Tarjeta:
                    </label>
                    <div className="input-group-precio">
                      <span className="precio-simbolo">C$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={tarjeta}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0
                          setTarjeta(Math.max(0, value))
                          setError('')
                        }}
                        className="form-input-precio"
                        disabled={loading || productosSeleccionados.length === 0}
                      />
                    </div>
                    {tarjeta > 0 && (
                      <select
                        value={bancoTarjeta}
                        onChange={(e) => {
                          setBancoTarjeta(e.target.value)
                          setError('')
                        }}
                        className="form-select-banco"
                        disabled={loading || productosSeleccionados.length === 0}
                        style={{ marginTop: '0.5rem' }}
                      >
                        <option value="">Banco para tarjeta</option>
                        {bancosDisponibles.map((bancoItem) => (
                          <option key={`tarjeta-${bancoItem}`} value={bancoItem}>
                            {bancoItem}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  {/* Transferencia con banco */}
                  <div className="form-grupo">
                    <label className="form-label">
                      <span className="monto-mixto-label-icono">🏦</span>
                      Transferencia:
                    </label>
                    <div className="input-group-precio">
                      <span className="precio-simbolo">C$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={transferencia}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0
                          setTransferencia(Math.max(0, value))
                          setError('')
                        }}
                        className="form-input-precio"
                        disabled={loading || productosSeleccionados.length === 0}
                      />
                    </div>
                    {transferencia > 0 && (
                      <select
                        value={bancoTransferencia}
                        onChange={(e) => {
                          setBancoTransferencia(e.target.value)
                          setError('')
                        }}
                        className="form-select-banco"
                        disabled={loading || productosSeleccionados.length === 0}
                        style={{ marginTop: '0.5rem' }}
                      >
                        <option value="">Banco para transferencia</option>
                        {bancosDisponibles.map((bancoItem) => (
                          <option key={`transferencia-${bancoItem}`} value={bancoItem}>
                            {bancoItem}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                
                <div className="resumen-mixto">
                  <div className="resumen-mixto-item">
                    <span className="resumen-mixto-label">Total venta:</span>
                    <span className="resumen-mixto-valor">C$${totalGeneral.toFixed(2)}</span>
                  </div>
                  <div className="resumen-mixto-item">
                    <span className="resumen-mixto-label">Total pagos:</span>
                    <span className="resumen-mixto-valor">C$${totalPagos.toFixed(2)}</span>
                  </div>
                  {diferencia > 0 && (
                    <div className="resumen-mixto-item resumen-vuelto">
                      <span className="resumen-mixto-label">Vuelto:</span>
                      <span className="resumen-mixto-valor">C$${diferencia.toFixed(2)}</span>
                    </div>
                  )}
                  {diferencia < 0 && (
                    <div className="resumen-mixto-item resumen-error">
                      <span className="resumen-mixto-label">Falta:</span>
                      <span className="resumen-mixto-valor">C$${Math.abs(diferencia).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Validación de pago */}
            <div className={`validacion-total ${diferencia >= 0 ? 'validacion-ok' : 'validacion-error'}`}>
              {diferencia === 0 ? (
                <div className="validacion-mensaje validacion-ok">
                  <span className="validacion-icono">✓</span>
                  Pago exacto
                </div>
              ) : diferencia > 0 ? (
                <div className="validacion-mensaje validacion-vuelto">
                  <span className="validacion-icono">🔄</span>
                  Pago completo. Vuelto: C$${vuelto.toFixed(2)}
                </div>
              ) : (
                <div className="validacion-mensaje validacion-error">
                  <span className="validacion-icono">⚠</span>
                  Pago insuficiente. Faltan: C$${Math.abs(diferencia).toFixed(2)}
                </div>
              )}
            </div>

            {/* Mostrar error */}
            {error && (
              <div className="error-mensaje">
                <svg className="error-icono" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
          </div>
          
          <div className="modal-footer-nueva-venta">
            <button
              type="button"
              onClick={onClose}
              className="btn-secundario"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primario-venta"
              disabled={loading || productosSeleccionados.length === 0 || totalPagos < totalGeneral}
            >
              {loading ? (
                <>
                  <div className="spinner-pequeno"></div>
                  Registrando...
                </>
              ) : (
                <>
                  <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M5 13l4 4L19 7" />
                  </svg>
                  Confirmar Venta
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalNuevaVenta