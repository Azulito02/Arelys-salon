import React, { useState, useEffect } from 'react'
import './ModalNuevaVenta.css'

const ModalNuevaVenta = ({
  isOpen,
  onClose,
  onSave,
  productos
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Estado para búsqueda de productos principal
  const [busqueda, setBusqueda] = useState('')
  const [productosFiltrados, setProductosFiltrados] = useState([])
  const [mostrarResultados, setMostrarResultados] = useState(false)
  
  // Estado para búsqueda manual en productos agregados
  const [busquedaManual, setBusquedaManual] = useState('')
  const [productosFiltradosManual, setProductosFiltradosManual] = useState([])
  const [mostrarResultadosManual, setMostrarResultadosManual] = useState(false)
  
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
      setProductosFiltrados([])
      setMostrarResultados(false)
      setProductosSeleccionados([])
      setBusquedaManual('')
      setProductosFiltradosManual([])
      setMostrarResultadosManual(false)
    }
  }, [isOpen])

  // Filtrar productos según búsqueda principal
  useEffect(() => {
    if (busqueda.trim() === '') {
      setProductosFiltrados([])
      setMostrarResultados(false)
      return
    }

    const termino = busqueda.toLowerCase().trim()
    
    const filtrados = productos.filter(producto => {
      if (producto.nombre?.toLowerCase().includes(termino)) return true
      if (producto.categoria?.toLowerCase().includes(termino)) return true
      if (producto.codigo_barras?.toLowerCase().includes(termino)) return true
      return false
    })
    
    setProductosFiltrados(filtrados)
    setMostrarResultados(true)
  }, [busqueda, productos])

  // Filtrar productos según búsqueda manual
  useEffect(() => {
    if (busquedaManual.trim() === '') {
      setProductosFiltradosManual([])
      setMostrarResultadosManual(false)
      return
    }

    const termino = busquedaManual.toLowerCase().trim()
    
    const filtrados = productos.filter(producto => {
      if (producto.nombre?.toLowerCase().includes(termino)) return true
      if (producto.categoria?.toLowerCase().includes(termino)) return true
      if (producto.codigo_barras?.toLowerCase().includes(termino)) return true
      return false
    })
    
    setProductosFiltradosManual(filtrados)
    setMostrarResultadosManual(true)
  }, [busquedaManual, productos])

  // Agregar producto desde búsqueda principal
  const agregarProductoDesdeBusqueda = (producto) => {
    // Verificar si el producto ya está en la lista
    const existe = productosSeleccionados.find(p => p.producto_id === producto.id)
    
    if (existe) {
      // Si existe, incrementar cantidad
      setProductosSeleccionados(prev =>
        prev.map(p =>
          p.producto_id === producto.id
            ? { ...p, cantidad: p.cantidad + 1 }
            : p
        )
      )
    } else {
      // Si no existe, agregar nuevo
      setProductosSeleccionados(prev => [
        ...prev,
        {
          id: Date.now() + Math.random(), // ID temporal
          producto_id: producto.id,
          cantidad: 1,
          precio_unitario: producto.precio || 0,
          producto_nombre: producto.nombre,
          producto_categoria: producto.categoria,
          producto_codigo: producto.codigo_barras
        }
      ])
    }
    
    setBusqueda('')
    setMostrarResultados(false)
    setError('')
  }

  // Agregar producto manualmente (botón)
  const agregarProductoManual = () => {
    setProductosSeleccionados(prev => [
      ...prev,
      { 
        id: Date.now() + Math.random(),
        producto_id: '', 
        cantidad: 1, 
        precio_unitario: 0,
        producto_nombre: '',
        producto_categoria: '',
        producto_codigo: ''
      }
    ])
  }

  // Eliminar producto de la lista
  const eliminarProducto = (index) => {
    const nuevosProductos = [...productosSeleccionados]
    nuevosProductos.splice(index, 1)
    setProductosSeleccionados(nuevosProductos)
  }

  // Actualizar producto en la lista
  const actualizarProducto = (index, campo, valor) => {
    const nuevosProductos = [...productosSeleccionados]
    
    if (campo === 'producto_id') {
      const producto = productos.find(p => p.id === valor)
      nuevosProductos[index] = {
        ...nuevosProductos[index],
        producto_id: valor,
        precio_unitario: producto?.precio || 0,
        producto_nombre: producto?.nombre,
        producto_categoria: producto?.categoria,
        producto_codigo: producto?.codigo_barras
      }
    } else if (campo === 'cantidad') {
      nuevosProductos[index] = {
        ...nuevosProductos[index],
        cantidad: Math.max(1, parseInt(valor) || 1)
      }
    } else if (campo === 'precio_unitario') {
      nuevosProductos[index] = {
        ...nuevosProductos[index],
        precio_unitario: parseFloat(valor) || 0
      }
    }
    
    setProductosSeleccionados(nuevosProductos)
  }

  // Calcular totales
  const calcularTotalProducto = (producto) => {
    return producto.cantidad * producto.precio_unitario
  }

  const calcularTotalGeneral = () => {
    return productosSeleccionados.reduce((total, producto) => {
      return total + calcularTotalProducto(producto)
    }, 0)
  }

  const totalGeneral = calcularTotalGeneral()
  const totalPagos = efectivo + tarjeta + transferencia
  const diferencia = totalPagos - totalGeneral

  // Calcular vuelto automáticamente
  useEffect(() => {
    if (diferencia > 0) {
      setVuelto(diferencia)
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (productosSeleccionados.length === 0) {
      setError('Agrega al menos un producto')
      return
    }

    const totalGeneral = calcularTotalGeneral()
    if (totalGeneral <= 0) {
      setError('El total debe ser mayor a 0')
      return
    }

    // Validar que todos los productos tengan producto_id
    const productosInvalidos = productosSeleccionados.filter(p => !p.producto_id)
    if (productosInvalidos.length > 0) {
      setError('Todos los productos deben estar seleccionados')
      return
    }

    if (totalPagos <= 0) {
      setError('El monto de la venta debe ser mayor a 0')
      return
    }

    if (totalPagos < totalGeneral) {
      setError(`El pago ($${totalPagos.toFixed(2)}) es menor al total ($${totalGeneral.toFixed(2)})`)
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
      // Crear una venta por cada producto
      const ventas = productosSeleccionados.map(producto => {
        const datosVenta = {
          producto_id: producto.producto_id,
          cantidad: producto.cantidad,
          precio_unitario: producto.precio_unitario,
          total: calcularTotalProducto(producto),
          fecha: new Date().toISOString(),
          metodo_pago: metodoPago,
          efectivo: 0,
          tarjeta: 0,
          transferencia: 0,
          vuelto: 0
        }

        // Distribuir pagos proporcionalmente
        const proporcion = calcularTotalProducto(producto) / totalGeneral
        
        if (metodoPago === 'efectivo') {
          datosVenta.efectivo = parseFloat((efectivo * proporcion).toFixed(2))
          datosVenta.vuelto = parseFloat((vuelto * proporcion).toFixed(2))
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
          
          // Guardar bancos en JSON
          const bancosMixto = {
            tarjeta: bancoTarjeta || null,
            transferencia: bancoTransferencia || null
          }
          datosVenta.banco = JSON.stringify(bancosMixto)
        }

        return datosVenta
      })
      
      console.log('Guardando ventas:', ventas)
      
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
            {/* BÚSQUEDA DE PRODUCTOS */}
            <div className="form-grupo">
              <label className="form-label">
                Buscar Producto
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
                      setProductosFiltrados([])
                      setMostrarResultados(false)
                    }}
                    className="boton-limpiar-busqueda"
                  >
                    ×
                  </button>
                )}
                
                {/* Resultados de búsqueda */}
                {mostrarResultados && productosFiltrados.length > 0 && (
                  <div className="resultados-busqueda">
                    {productosFiltrados.slice(0, 10).map((producto) => (
                      <div
                        key={producto.id}
                        className="resultado-item"
                        onClick={() => agregarProductoDesdeBusqueda(producto)}
                      >
                        <div className="resultado-nombre">
                          <strong>{producto.nombre}</strong>
                          {producto.categoria && (
                            <span className="resultado-categoria"> ({producto.categoria})</span>
                          )}
                        </div>
                        <div className="resultado-info">
                          <span className="resultado-precio">${producto.precio?.toFixed(2)}</span>
                          {producto.codigo_barras && (
                            <span className="resultado-codigo">📟 {producto.codigo_barras}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {mostrarResultados && productosFiltrados.length === 0 && (
                  <div className="resultados-busqueda">
                    <div className="resultado-vacio">
                      No se encontraron productos con "{busqueda}"
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* LISTA DE PRODUCTOS SELECCIONADOS */}
            <div className="productos-container">
              <div className="productos-header">
                <h4 className="productos-titulo">Productos ({productosSeleccionados.length})</h4>
                <button
                  type="button"
                  onClick={agregarProductoManual}
                  className="btn-agregar-producto"
                  disabled={loading}
                >
                  + Agregar Producto
                </button>
              </div>
              
              {productosSeleccionados.length === 0 ? (
                <div className="sin-productos">
                  <p>No hay productos agregados. Busca o agrega productos.</p>
                </div>
              ) : (
                <div className="lista-productos">
                  {productosSeleccionados.map((producto, index) => {
                    const productoInfo = productos.find(p => p.id === producto.producto_id)
                    return (
                      <div key={producto.id} className="producto-item">
                        <div className="producto-header">
                          <span className="producto-numero">#{index + 1}</span>
                          <button
                            type="button"
                            onClick={() => eliminarProducto(index)}
                            className="btn-eliminar-producto"
                            disabled={loading}
                          >
                            ×
                          </button>
                        </div>
                        
                        <div className="producto-form">
                          <div className="producto-seleccionado-info">
                            {producto.producto_nombre ? (
                              <div className="producto-info-actual">
                                <strong>{producto.producto_nombre}</strong>
                                {producto.producto_categoria && (
                                  <span className="producto-info-categoria"> ({producto.producto_categoria})</span>
                                )}
                                {producto.producto_codigo && (
                                  <div className="producto-info-codigo">
                                    <small>Código: {producto.producto_codigo}</small>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="producto-busqueda-container">
                                <input
                                  type="text"
                                  value={busquedaManual}
                                  onChange={(e) => setBusquedaManual(e.target.value)}
                                  placeholder="Buscar producto..."
                                  className="form-input-busqueda"
                                  disabled={loading}
                                />
                                {mostrarResultadosManual && productosFiltradosManual.length > 0 && (
                                  <div className="resultados-busqueda-manual">
                                    {productosFiltradosManual.slice(0, 5).map((p) => (
                                      <div
                                        key={p.id}
                                        className="resultado-item"
                                        onClick={() => {
                                          actualizarProducto(index, 'producto_id', p.id)
                                          setBusquedaManual('')
                                          setMostrarResultadosManual(false)
                                        }}
                                      >
                                        <div className="resultado-nombre">
                                          <strong>{p.nombre}</strong>
                                          {p.categoria && (
                                            <span className="resultado-categoria"> ({p.categoria})</span>
                                          )}
                                        </div>
                                        <div className="resultado-info">
                                          <span className="resultado-precio">${p.precio?.toFixed(2)}</span>
                                          {p.codigo_barras && (
                                            <span className="resultado-codigo">📟 {p.codigo_barras}</span>
                                          )}
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
                                  onClick={() => actualizarProducto(index, 'cantidad', producto.cantidad - 1)}
                                  className="cantidad-btn"
                                  disabled={loading}
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={producto.cantidad}
                                  onChange={(e) => actualizarProducto(index, 'cantidad', e.target.value)}
                                  className="form-input-cantidad"
                                  disabled={loading}
                                  required
                                />
                                <button
                                  type="button"
                                  onClick={() => actualizarProducto(index, 'cantidad', producto.cantidad + 1)}
                                  className="cantidad-btn"
                                  disabled={loading}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            <div>
                              <label>Precio Unit.</label>
                              <div className="input-group-precio">
                                <span className="precio-simbolo">$</span>
                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={producto.precio_unitario}
                                  onChange={(e) => actualizarProducto(index, 'precio_unitario', e.target.value)}
                                  className="form-input-precio"
                                  disabled={loading}
                                  required
                                />
                              </div>
                            </div>
                            <div className="producto-subtotal">
                              <label>Subtotal</label>
                              <div className="subtotal-valor">
                                ${calcularTotalProducto(producto).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
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
                      {productosSeleccionados.length} productos
                    </div>
                  </div>
                  <div className="total-amount-container">
                    <span className="total-amount">${totalGeneral.toFixed(2)}</span>
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
                            disabled={productosSeleccionados.length === 0}
                            title="Pagar con $10"
                          >
                            Con $10
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handlePagoConVuelto(50)}
                            className="btn-pago-vuelto"
                            disabled={productosSeleccionados.length === 0}
                            title="Pagar con $50"
                          >
                            Con $50
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handlePagoConVuelto(100)}
                            className="btn-pago-vuelto"
                            disabled={productosSeleccionados.length === 0}
                            title="Pagar con $100"
                          >
                            Con $100
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handlePagoConVuelto(200)}
                            className="btn-pago-vuelto"
                            disabled={productosSeleccionados.length === 0}
                            title="Pagar con $200"
                          >
                            Con $200
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handlePagoConVuelto(500)}
                            className="btn-pago-vuelto"
                            disabled={productosSeleccionados.length === 0}
                            title="Pagar con $500"
                          >
                            Con $500
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handlePagoConVuelto(1000)}
                            className="btn-pago-vuelto"
                            disabled={productosSeleccionados.length === 0}
                            title="Pagar con $1000"
                          >
                            Con $1000
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
                      <span className="vuelto-amount">${vuelto.toFixed(2)}</span>
                    </div>
                    <div className="vuelto-detalle">
                      Se pagó ${totalPagos.toFixed(2)} - Total ${totalGeneral.toFixed(2)}
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
                  <span className="precio-simbolo">$</span>
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
                    <span className="vuelto-mini-amount">${vuelto.toFixed(2)}</span>
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
                      <span className="precio-simbolo">$</span>
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
                      <span className="precio-simbolo">$</span>
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
                      <span className="precio-simbolo">$</span>
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
                    <span className="resumen-mixto-valor">${totalGeneral.toFixed(2)}</span>
                  </div>
                  <div className="resumen-mixto-item">
                    <span className="resumen-mixto-label">Total pagos:</span>
                    <span className="resumen-mixto-valor">${totalPagos.toFixed(2)}</span>
                  </div>
                  {diferencia > 0 && (
                    <div className="resumen-mixto-item resumen-vuelto">
                      <span className="resumen-mixto-label">Vuelto:</span>
                      <span className="resumen-mixto-valor">${diferencia.toFixed(2)}</span>
                    </div>
                  )}
                  {diferencia < 0 && (
                    <div className="resumen-mixto-item resumen-error">
                      <span className="resumen-mixto-label">Falta:</span>
                      <span className="resumen-mixto-valor">${Math.abs(diferencia).toFixed(2)}</span>
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
                  Pago completo. Vuelto: ${vuelto.toFixed(2)}
                </div>
              ) : (
                <div className="validacion-mensaje validacion-error">
                  <span className="validacion-icono">⚠</span>
                  Pago insuficiente. Faltan: ${Math.abs(diferencia).toFixed(2)}
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