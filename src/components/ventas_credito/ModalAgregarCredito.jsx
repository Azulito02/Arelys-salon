import React, { useState, useEffect } from 'react'
import { supabase } from '../../database/supabase'
import './ModalAgregarCredito.css'

const ModalAgregarCredito = ({ isOpen, onClose, onCreditoAgregado, productos }) => {
  const [formData, setFormData] = useState({
    cliente_nombre: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  })
  
  // Estado para búsqueda de productos principal
  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [productosFiltrados, setProductosFiltrados] = useState([])
  const [mostrarResultados, setMostrarResultados] = useState(false)
  
  // Estado para búsqueda manual en productos agregados
  const [busquedaManual, setBusquedaManual] = useState('')
  const [productosFiltradosManual, setProductosFiltradosManual] = useState([])
  const [mostrarResultadosManual, setMostrarResultadosManual] = useState(false)
  const [indiceBuscando, setIndiceBuscando] = useState(null)
  
  const [productosSeleccionados, setProductosSeleccionados] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clientes, setClientes] = useState([])
  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false)
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', telefono: '', email: '' })

  // Cargar clientes al abrir el modal
  useEffect(() => {
    if (isOpen) {
      cargarClientes()
      resetForm()
    }
  }, [isOpen])

  // Filtrar productos según búsqueda principal
  useEffect(() => {
    if (busquedaProducto.trim() === '') {
      setProductosFiltrados([])
      setMostrarResultados(false)
      return
    }

    const termino = busquedaProducto.toLowerCase().trim()
    
    const filtrados = productos.filter(producto => {
      if (producto.nombre?.toLowerCase().includes(termino)) return true
      if (producto.categoria?.toLowerCase().includes(termino)) return true
      if (producto.codigo_barras?.toLowerCase().includes(termino)) return true
      return false
    })
    
    setProductosFiltrados(filtrados)
    setMostrarResultados(true)
  }, [busquedaProducto, productos])

  // Filtrar productos según búsqueda manual
  useEffect(() => {
    if (busquedaManual.trim() === '' || indiceBuscando === null) {
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
  }, [busquedaManual, productos, indiceBuscando])

  const cargarClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('activo', true)
        .order('nombre')
      
      if (error) throw error
      setClientes(data || [])
    } catch (err) {
      console.error('Error cargando clientes:', err)
      // Si no existe la tabla clientes, usar nombres de ventas_credito
      const { data: ventasData } = await supabase
        .from('ventas_credito')
        .select('nombre_cliente')
        .not('nombre_cliente', 'is', null)
        .order('nombre_cliente')
      
      if (ventasData) {
        const nombresUnicos = [...new Set(ventasData.map(v => v.nombre_cliente))]
        setClientes(nombresUnicos.map(nombre => ({ id: nombre, nombre })))
      }
    }
  }

  const resetForm = () => {
    setFormData({
      cliente_nombre: '',
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    })
    setProductosSeleccionados([])
    setNuevoCliente({ nombre: '', telefono: '', email: '' })
    setMostrarNuevoCliente(false)
    setBusquedaProducto('')
    setProductosFiltrados([])
    setMostrarResultados(false)
    setBusquedaManual('')
    setProductosFiltradosManual([])
    setMostrarResultadosManual(false)
    setIndiceBuscando(null)
    setError('')
  }

  // Función auxiliar para obtener el precio del producto
  const obtenerPrecioProducto = (producto) => {
    if (producto.precio_venta !== undefined && producto.precio_venta !== null) {
      return parseFloat(producto.precio_venta)
    }
    if (producto.precio !== undefined && producto.precio !== null) {
      return parseFloat(producto.precio)
    }
    if (producto.precio_unitario !== undefined && producto.precio_unitario !== null) {
      return parseFloat(producto.precio_unitario)
    }
    return 0
  }

  // Agregar producto desde búsqueda - CORREGIDA
  const agregarProductoDesdeBusqueda = (producto) => {
    console.log('🔍 [CRÉDITO] Producto recibido para agregar:', producto)
    
    // Verificar si el producto ya está en la lista
    const existeIndex = productosSeleccionados.findIndex(p => p.producto_id === producto.id)
    
    // Obtener el precio correcto
    const precioProducto = obtenerPrecioProducto(producto)
    console.log('💰 [CRÉDITO] Precio asignado:', precioProducto)
    
    if (existeIndex !== -1) {
      // Si existe, incrementar cantidad
      setProductosSeleccionados(prev =>
        prev.map((p, idx) =>
          idx === existeIndex
            ? { 
                ...p, 
                cantidad: p.cantidad + 1,
                precio_unitario: precioProducto > 0 ? precioProducto : p.precio_unitario
              }
            : p
        )
      )
    } else {
      // Si no existe, agregar nuevo
      const nuevoProducto = {
        id: Date.now() + Math.random(),
        producto_id: producto.id,
        cantidad: 1,
        precio_unitario: precioProducto,
        producto_nombre: producto.nombre || producto.producto_nombre,
        producto_categoria: producto.categoria || producto.producto_categoria,
        producto_codigo: producto.codigo_barras || producto.producto_codigo || producto.codigo
      }
      
      console.log('🛒 [CRÉDITO] Nuevo producto agregado:', nuevoProducto)
      
      setProductosSeleccionados(prev => [...prev, nuevoProducto])
    }
    
    setBusquedaProducto('')
    setMostrarResultados(false)
    setError('')
  }

  // Agregar producto manualmente (botón)
  const agregarProductoManual = () => {
    const nuevoProducto = { 
      id: Date.now() + Math.random(),
      producto_id: '', 
      cantidad: 1, 
      precio_unitario: 0,
      producto_nombre: '',
      producto_categoria: '',
      producto_codigo: ''
    }
    
    setProductosSeleccionados(prev => [...prev, nuevoProducto])
    // Establecer que estamos buscando para el último producto agregado
    setIndiceBuscando(productosSeleccionados.length)
    setBusquedaManual('')
  }

  // Eliminar producto de la lista
  const eliminarProducto = (index) => {
    const nuevosProductos = [...productosSeleccionados]
    nuevosProductos.splice(index, 1)
    setProductosSeleccionados(nuevosProductos)
  }

  // Actualizar producto en la lista - CORREGIDA
  const actualizarProducto = (index, campo, valor) => {
    const nuevosProductos = [...productosSeleccionados]
    
    if (campo === 'producto_id') {
      const producto = productos.find(p => p.id === valor)
      if (producto) {
        const precioAsignar = obtenerPrecioProducto(producto)
        nuevosProductos[index] = {
          ...nuevosProductos[index],
          producto_id: valor,
          precio_unitario: precioAsignar,
          producto_nombre: producto.nombre,
          producto_categoria: producto.categoria,
          producto_codigo: producto.codigo_barras
        }
        console.log(`✅ [CRÉDITO] Producto ${index} actualizado con precio: C$${precioAsignar}`)
      }
    } else if (campo === 'cantidad') {
      const nuevaCantidad = Math.max(1, parseInt(valor) || 1)
      nuevosProductos[index] = {
        ...nuevosProductos[index],
        cantidad: nuevaCantidad
      }
    } else if (campo === 'precio_unitario') {
      const nuevoPrecio = parseFloat(valor) || 0
      nuevosProductos[index] = {
        ...nuevosProductos[index],
        precio_unitario: nuevoPrecio
      }
    }
    
    setProductosSeleccionados(nuevosProductos)
  }


  const incrementarCantidad = (index) => {
  const nuevosProductos = [...productosSeleccionados]
  nuevosProductos[index] = {
    ...nuevosProductos[index],
    cantidad: (nuevosProductos[index].cantidad || 1) + 1
  }
  setProductosSeleccionados(nuevosProductos)
}

const decrementarCantidad = (index) => {
  const nuevosProductos = [...productosSeleccionados]
  const nuevaCantidad = Math.max(1, (nuevosProductos[index].cantidad || 1) - 1)
  nuevosProductos[index] = {
    ...nuevosProductos[index],
    cantidad: nuevaCantidad
  }
  setProductosSeleccionados(nuevosProductos)
}

  // Calcular totales - CORREGIDA
  const calcularTotalProducto = (producto) => {
    if (!producto) return 0
    
    const cantidad = parseInt(producto.cantidad) || 1
    const precio = parseFloat(producto.precio_unitario) || 0
    
    const subtotal = cantidad * precio
    return subtotal
  }

  const calcularTotalGeneral = () => {
    return productosSeleccionados.reduce((total, producto) => {
      return total + calcularTotalProducto(producto)
    }, 0)
  }

  // Registrar nuevo cliente
  const registrarNuevoCliente = async () => {
    if (!nuevoCliente.nombre.trim()) {
      setError('El nombre del cliente es obligatorio')
      return null
    }

    try {
      // Verificar si ya existe en clientes
      const clienteExistente = clientes.find(c => 
        typeof c === 'object' ? c.nombre === nuevoCliente.nombre.trim() : c === nuevoCliente.nombre.trim()
      )
      
      if (clienteExistente) {
        const clienteId = typeof clienteExistente === 'object' ? clienteExistente.id : clienteExistente
        setFormData({ ...formData, cliente_nombre: clienteId })
        setMostrarNuevoCliente(false)
        return clienteId
      }

      try {
        const { data, error } = await supabase
          .from('clientes')
          .insert([{
            nombre: nuevoCliente.nombre.trim(),
            telefono: nuevoCliente.telefono || null,
            email: nuevoCliente.email || null
          }])
          .select()
        
        if (!error && data && data[0]) {
          setClientes([...clientes, data[0]])
          setFormData({ ...formData, cliente_nombre: data[0].id })
          setMostrarNuevoCliente(false)
          return data[0].id
        }
      } catch (err) {
        console.log('No se pudo registrar en tabla clientes, usando nombre directo')
      }

      setFormData({ ...formData, cliente_nombre: nuevoCliente.nombre.trim() })
      setMostrarNuevoCliente(false)
      return nuevoCliente.nombre.trim()
      
    } catch (err) {
      console.error('Error registrando cliente:', err)
      setError('Error al registrar el cliente: ' + err.message)
      return null
    }
  }

  // Seleccionar producto desde búsqueda manual
  const seleccionarProductoManual = (producto, index) => {
    const precioAsignar = obtenerPrecioProducto(producto)
    actualizarProducto(index, 'producto_id', producto.id)
    setBusquedaManual('')
    setMostrarResultadosManual(false)
    setIndiceBuscando(null)
    console.log(`✅ [CRÉDITO] Producto manual seleccionado para índice ${index} con precio: C$${precioAsignar}`)
  }

  // Iniciar búsqueda manual para un producto específico
  const iniciarBusquedaManual = (index) => {
    setIndiceBuscando(index)
    setBusquedaManual('')
    setProductosFiltradosManual([])
    setMostrarResultadosManual(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.cliente_nombre) {
      setError('Selecciona o registra un cliente')
      return
    }

    if (productosSeleccionados.length === 0) {
      setError('Agrega al menos un producto')
      return
    }

    const totalGeneral = calcularTotalGeneral()
    if (totalGeneral <= 0) {
      setError('El total debe ser mayor a 0')
      return
    }

    const productosInvalidos = productosSeleccionados.filter(p => !p.producto_id)
    if (productosInvalidos.length > 0) {
      setError('Todos los productos deben estar seleccionados')
      return
    }

    setLoading(true)
    setError('')

    try {
      let clienteNombre = formData.cliente_nombre
      
      if (clienteNombre.includes('-')) {
        const cliente = clientes.find(c => c.id === clienteNombre)
        if (cliente) {
          clienteNombre = cliente.nombre
        }
      }

      const ventasCredito = productosSeleccionados.map(producto => ({
        producto_id: producto.producto_id,
        cantidad: producto.cantidad,
        precio_unitario: producto.precio_unitario,
        total: calcularTotalProducto(producto),
        nombre_cliente: clienteNombre,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        saldo_pendiente: calcularTotalProducto(producto),
        estado: 'activo'
      }))

      console.log('Creando ventas a crédito:', ventasCredito)
      
      const { error: errorVentas } = await supabase
        .from('ventas_credito')
        .insert(ventasCredito)
      
      if (errorVentas) throw errorVentas

      try {
        const facturas = ventasCredito.map(venta => ({
          tipo_venta: 'credito',
          producto_id: venta.producto_id,
          cantidad: venta.cantidad,
          precio_unitario: venta.precio_unitario,
          total: venta.total,
          metodo_pago: 'credito',
          fecha: new Date().toISOString()
        }))

        await supabase
          .from('facturados')
          .insert(facturas)
      } catch (err) {
        console.log('No se pudo registrar en facturados:', err)
      }

      resetForm()
      onCreditoAgregado()
      onClose()
      
    } catch (err) {
      console.error('Error agregando crédito:', err)
      setError('Error al registrar el crédito: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-container-nuevo-credito">
        <div className="modal-header-nuevo-credito">
          <div className="modal-titulo-contenedor">
            <svg className="modal-icono-nuevo" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="modal-titulo-nuevo-credito">Nueva Venta a Crédito</h3>
          </div>
          <button onClick={onClose} className="modal-cerrar-btn" disabled={loading}>
            &times;
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form-credito">
          <div className="modal-contenido-nuevo-credito">
            {error && (
              <div className="error-mensaje">
                <svg className="error-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            
            {/* Selección de Cliente */}
            <div className="form-grupo">
              <label className="form-label">
                Cliente *
              </label>
              {!mostrarNuevoCliente ? (
                <div className="cliente-seleccion-container">
                  <select
                    value={formData.cliente_nombre}
                    onChange={(e) => setFormData({...formData, cliente_nombre: e.target.value})}
                    className="form-select"
                    disabled={loading}
                  >
                    <option value="">Selecciona un cliente</option>
                    {clientes.map((cliente) => {
                      const clienteId = typeof cliente === 'object' ? cliente.id : cliente
                      const clienteNombre = typeof cliente === 'object' ? cliente.nombre : cliente
                      return (
                        <option key={clienteId} value={clienteId}>
                          {clienteNombre}
                        </option>
                      )
                    })}
                  </select>
                  <button
                    type="button"
                    onClick={() => setMostrarNuevoCliente(true)}
                    className="btn-nuevo-cliente"
                  >
                    + Nuevo Cliente
                  </button>
                </div>
              ) : (
                <div className="nuevo-cliente-form">
                  <input
                    type="text"
                    value={nuevoCliente.nombre}
                    onChange={(e) => setNuevoCliente({...nuevoCliente, nombre: e.target.value})}
                    className="form-input"
                    placeholder="Nombre completo *"
                    disabled={loading}
                    required
                  />
                  <input
                    type="text"
                    value={nuevoCliente.telefono}
                    onChange={(e) => setNuevoCliente({...nuevoCliente, telefono: e.target.value})}
                    className="form-input"
                    placeholder="Teléfono (opcional)"
                    disabled={loading}
                  />
                  <input
                    type="email"
                    value={nuevoCliente.email}
                    onChange={(e) => setNuevoCliente({...nuevoCliente, email: e.target.value})}
                    className="form-input"
                    placeholder="Email (opcional)"
                    disabled={loading}
                  />
                  <div className="nuevo-cliente-botones">
                    <button
                      type="button"
                      onClick={() => setMostrarNuevoCliente(false)}
                      className="btn-cancelar-cliente"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={registrarNuevoCliente}
                      className="btn-guardar-cliente"
                      disabled={!nuevoCliente.nombre.trim()}
                    >
                      Guardar Cliente
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* BÚSQUEDA DE PRODUCTOS */}
            <div className="form-grupo">
              <label className="form-label">
                Buscar Producto
                <span className="hint-text"> (nombre, categoría, código de barras)</span>
              </label>
              <div className="busqueda-producto-container">
                <input
                  type="text"
                  value={busquedaProducto}
                  onChange={(e) => setBusquedaProducto(e.target.value)}
                  onFocus={() => {
                    if (busquedaProducto.trim()) setMostrarResultados(true)
                  }}
                  className="form-input-busqueda"
                  placeholder="Escribe para buscar productos..."
                  disabled={loading}
                />
                {busquedaProducto && (
                  <button
                    type="button"
                    onClick={() => {
                      setBusquedaProducto('')
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
                          <span className="resultado-precio">C${obtenerPrecioProducto(producto).toFixed(2)}</span>
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
                      No se encontraron productos con "{busquedaProducto}"
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Lista de Productos */}
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
                  {productosSeleccionados.map((producto, index) => (
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
                              {producto.precio_unitario > 0 && (
                                <div className="producto-info-precio">
                                  <small>Precio: C${producto.precio_unitario.toFixed(2)}</small>
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
                                placeholder="Buscar producto para agregar..."
                                className="form-input-busqueda"
                                disabled={loading}
                              />
                              {indiceBuscando === index && mostrarResultadosManual && productosFiltradosManual.length > 0 && (
                                <div className="resultados-busqueda-manual">
                                  {productosFiltradosManual.slice(0, 5).map((p) => (
                                    <div
                                      key={p.id}
                                      className="resultado-item"
                                      onClick={() => seleccionarProductoManual(p, index)}
                                    >
                                      <div className="resultado-nombre">
                                        <strong>{p.nombre}</strong>
                                        {p.categoria && (
                                          <span className="resultado-categoria"> ({p.categoria})</span>
                                        )}
                                      </div>
                                      <div className="resultado-info">
                                        <span className="resultado-precio">C${obtenerPrecioProducto(p).toFixed(2)}</span>
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
                       
                       <div className="form-grupo">
                          <label className="form-label">Cantidad</label>
                          <div className="input-group-cantidad-credito">
                            <button 
                              type="button" 
                              className="cantidad-btn-credito cantidad-btn-menos"
                              onClick={() => decrementarCantidad(index)}
                              disabled={loading}
                            >
                              -
                            </button>
                            <input 
                              type="number" 
                              className="form-input-cantidad-credito" 
                              value={producto.cantidad || 1}
                              min="1" 
                              max="999"
                              onChange={(e) => actualizarProducto(index, 'cantidad', e.target.value)}
                              disabled={loading}
                            />
                            <button 
                              type="button" 
                              className="cantidad-btn-credito cantidad-btn-mas"
                              onClick={() => incrementarCantidad(index)}
                              disabled={loading}
                            >
                              +
                            </button>
                          </div>
                        </div>
                       
                           <div>
                            <label>Precio Unit.</label>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={producto.precio_unitario}
                              onChange={(e) => actualizarProducto(index, 'precio_unitario', e.target.value)}
                              className="form-input"
                              disabled={loading || !producto.producto_id}
                              required
                            />
                          </div>
                          <div className="producto-subtotal">
                            <label>Subtotal</label>
                            <div className="subtotal-valor">
                              C${calcularTotalProducto(producto).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Fechas */}
            <div className="form-grid-credito">
              <div className="form-grupo">
                <label className="form-label">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
                  className="form-input"
                  disabled={loading}
                />
              </div>
              
              <div className="form-grupo">
                <label className="form-label">
                  Fecha Fin *
                </label>
                <input
                  type="date"
                  value={formData.fecha_fin}
                  onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})}
                  className="form-input"
                  disabled={loading}
                  required
                />
              </div>
            </div>
            
            {/* Resumen del crédito */}
            <div className="resumen-credito-container">
              <h4 className="resumen-credito-titulo">Resumen del Crédito</h4>
              <div className="resumen-detalles">
                <div className="resumen-item">
                  <span className="resumen-label">Cliente:</span>
                  <span className="resumen-valor">
                    {(() => {
                      const cliente = clientes.find(c => {
                        const clienteId = typeof c === 'object' ? c.id : c
                        return clienteId === formData.cliente_nombre
                      })
                      return cliente ? (typeof cliente === 'object' ? cliente.nombre : cliente) : 'No seleccionado'
                    })()}
                  </span>
                </div>
                <div className="resumen-item">
                  <span className="resumen-label">Productos:</span>
                  <span className="resumen-valor">
                    {productosSeleccionados.length} productos
                  </span>
                </div>
                <div className="resumen-item">
                  <span className="resumen-label">Total unidades:</span>
                  <span className="resumen-valor">
                    {productosSeleccionados.reduce((sum, p) => sum + p.cantidad, 0)} unidades
                  </span>
                </div>
                <div className="resumen-item resumen-total">
                  <span className="resumen-label">Total a Crédito:</span>
                  <span className="resumen-valor-total">
                    C${calcularTotalGeneral().toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="resumen-item">
                  <span className="resumen-label">Periodo:</span>
                  <span className="resumen-valor">
                    {formData.fecha_inicio} al {formData.fecha_fin}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="modal-footer-nuevo-credito">
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
              className="btn-primario-credito"
              disabled={loading || productosSeleccionados.length === 0 || !formData.cliente_nombre}
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
                      d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Registrar Crédito
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalAgregarCredito