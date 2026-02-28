import React, { useState, useEffect } from 'react'
import { supabase } from '../../database/supabase'
import './ModalAgregarCredito.css'

const ModalAgregarCredito = ({ 
  isOpen, 
  onClose, 
  onCreditoAgregado, 
  productos, 
  servicios = [],
  itemsDisponibles = [] 
}) => {
  const [formData, setFormData] = useState({
    cliente_nombre: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  })
  
  // Estado para búsqueda de items principal
  const [busquedaItem, setBusquedaItem] = useState('')
  const [itemsFiltrados, setItemsFiltrados] = useState([])
  const [mostrarResultados, setMostrarResultados] = useState(false)
  
  // Estado para búsqueda manual en items agregados
  const [busquedaManual, setBusquedaManual] = useState('')
  const [itemsFiltradosManual, setItemsFiltradosManual] = useState([])
  const [mostrarResultadosManual, setMostrarResultadosManual] = useState(false)
  const [indiceBuscando, setIndiceBuscando] = useState(null)
  
  const [itemsSeleccionados, setItemsSeleccionados] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clientes, setClientes] = useState([])
  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false)
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', telefono: '', email: '' })

  // Combinar items si no vienen de props
  const [itemsCombinados, setItemsCombinados] = useState([])

  useEffect(() => {
    if (itemsDisponibles && itemsDisponibles.length > 0) {
      setItemsCombinados(itemsDisponibles)
    } else {
      const combinados = [
        ...(productos || []).map(p => ({ ...p, tipo: 'producto', icono: '📦' })),
        ...(servicios || []).map(s => ({ ...s, tipo: 'servicio', icono: '💇' }))
      ]
      setItemsCombinados(combinados)
    }
  }, [productos, servicios, itemsDisponibles])

  // Cargar clientes al abrir el modal
  useEffect(() => {
    if (isOpen) {
      cargarClientes()
      resetForm()
    }
  }, [isOpen])

  // Filtrar items según búsqueda principal
  useEffect(() => {
    if (busquedaItem.trim() === '') {
      setItemsFiltrados([])
      setMostrarResultados(false)
      return
    }

    const termino = busquedaItem.toLowerCase().trim()
    
    const filtrados = itemsCombinados.filter(item => {
      if (item.nombre?.toLowerCase().includes(termino)) return true
      if (item.categoria?.toLowerCase().includes(termino)) return true
      if (item.codigo_barras?.toLowerCase().includes(termino)) return true
      return false
    })
    
    setItemsFiltrados(filtrados)
    setMostrarResultados(true)
  }, [busquedaItem, itemsCombinados])

  // Filtrar items según búsqueda manual
  useEffect(() => {
    if (busquedaManual.trim() === '' || indiceBuscando === null) {
      setItemsFiltradosManual([])
      setMostrarResultadosManual(false)
      return
    }

    const termino = busquedaManual.toLowerCase().trim()
    
    const filtrados = itemsCombinados.filter(item => {
      if (item.nombre?.toLowerCase().includes(termino)) return true
      if (item.categoria?.toLowerCase().includes(termino)) return true
      if (item.codigo_barras?.toLowerCase().includes(termino)) return true
      return false
    })
    
    setItemsFiltradosManual(filtrados)
    setMostrarResultadosManual(true)
  }, [busquedaManual, itemsCombinados, indiceBuscando])

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
    setItemsSeleccionados([])
    setNuevoCliente({ nombre: '', telefono: '', email: '' })
    setMostrarNuevoCliente(false)
    setBusquedaItem('')
    setItemsFiltrados([])
    setMostrarResultados(false)
    setBusquedaManual('')
    setItemsFiltradosManual([])
    setMostrarResultadosManual(false)
    setIndiceBuscando(null)
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

  // Agregar item desde búsqueda
  const agregarItemDesdeBusqueda = (item) => {
    console.log('🔍 [CRÉDITO] Item recibido para agregar:', item)
    
    // Verificar si el item ya está en la lista
    const existeIndex = itemsSeleccionados.findIndex(p => 
      p.item_id === item.id && p.tipo === item.tipo
    )
    
    // Obtener el precio correcto
    const precioItem = obtenerPrecioItem(item)
    console.log('💰 [CRÉDITO] Precio asignado:', precioItem)
    
    if (existeIndex !== -1) {
      // Si existe, incrementar cantidad
      setItemsSeleccionados(prev =>
        prev.map((p, idx) =>
          idx === existeIndex
            ? { ...p, cantidad: p.cantidad + 1 }
            : p
        )
      )
    } else {
      // Si no existe, agregar nuevo
      const nuevoItem = {
        id: Date.now() + Math.random(),
        item_id: item.id,
        tipo: item.tipo,
        cantidad: 1,
        precio_unitario: precioItem,
        item_nombre: item.nombre,
        item_categoria: item.categoria || '',
        item_codigo: item.codigo_barras || '',
        item_icono: item.tipo === 'servicio' ? '💇' : '📦'
      }
      
      console.log('🛒 [CRÉDITO] Nuevo item agregado:', nuevoItem)
      
      setItemsSeleccionados(prev => [...prev, nuevoItem])
    }
    
    setBusquedaItem('')
    setMostrarResultados(false)
    setError('')
  }

  // Agregar item manualmente (botón)
  const agregarItemManual = () => {
    const nuevoItem = { 
      id: Date.now() + Math.random(),
      item_id: '', 
      tipo: 'producto',
      cantidad: 1, 
      precio_unitario: 0,
      item_nombre: '',
      item_categoria: '',
      item_codigo: '',
      item_icono: '📦'
    }
    
    setItemsSeleccionados(prev => [...prev, nuevoItem])
    // Establecer que estamos buscando para el último item agregado
    setIndiceBuscando(itemsSeleccionados.length)
    setBusquedaManual('')
  }

  // Eliminar item de la lista
  const eliminarItem = (index) => {
    const nuevosItems = [...itemsSeleccionados]
    nuevosItems.splice(index, 1)
    setItemsSeleccionados(nuevosItems)
  }

  // Actualizar item en la lista
  const actualizarItem = (index, campo, valor, itemData) => {
    const nuevosItems = [...itemsSeleccionados]
    
    if (campo === 'item_id' && itemData) {
      const precioAsignar = obtenerPrecioItem(itemData)
      nuevosItems[index] = {
        ...nuevosItems[index],
        item_id: valor,
        tipo: itemData.tipo,
        precio_unitario: precioAsignar,
        item_nombre: itemData.nombre,
        item_categoria: itemData.categoria || '',
        item_codigo: itemData.codigo_barras || '',
        item_icono: itemData.tipo === 'servicio' ? '💇' : '📦'
      }
      console.log(`✅ [CRÉDITO] Item ${index} actualizado con precio: C$${precioAsignar}`)
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
    
    setItemsSeleccionados(nuevosItems)
  }

  const incrementarCantidad = (index) => {
    const nuevosItems = [...itemsSeleccionados]
    nuevosItems[index] = {
      ...nuevosItems[index],
      cantidad: (nuevosItems[index].cantidad || 1) + 1
    }
    setItemsSeleccionados(nuevosItems)
  }

  const decrementarCantidad = (index) => {
    const nuevosItems = [...itemsSeleccionados]
    const nuevaCantidad = Math.max(1, (nuevosItems[index].cantidad || 1) - 1)
    nuevosItems[index] = {
      ...nuevosItems[index],
      cantidad: nuevaCantidad
    }
    setItemsSeleccionados(nuevosItems)
  }

  // Calcular totales
  const calcularTotalItem = (item) => {
    if (!item) return 0
    
    const cantidad = parseInt(item.cantidad) || 1
    const precio = parseFloat(item.precio_unitario) || 0
    
    const subtotal = cantidad * precio
    return subtotal
  }

  const calcularTotalGeneral = () => {
    return itemsSeleccionados.reduce((total, item) => {
      return total + calcularTotalItem(item)
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

  // Seleccionar item desde búsqueda manual
  const seleccionarItemManual = (item, index) => {
    actualizarItem(index, 'item_id', item.id, item)
    setBusquedaManual('')
    setMostrarResultadosManual(false)
    setIndiceBuscando(null)
    console.log(`✅ [CRÉDITO] Item manual seleccionado para índice ${index} con precio: C$${obtenerPrecioItem(item)}`)
  }

  // Iniciar búsqueda manual para un item específico
  const iniciarBusquedaManual = (index) => {
    setIndiceBuscando(index)
    setBusquedaManual('')
    setItemsFiltradosManual([])
    setMostrarResultadosManual(false)
  }

  const handleSubmit = async (e) => {
  e.preventDefault()
  
  if (!formData.cliente_nombre) {
    setError('Selecciona o registra un cliente')
    return
  }

  if (itemsSeleccionados.length === 0) {
    setError('Agrega al menos un producto o servicio')
    return
  }

  const totalGeneral = calcularTotalGeneral()
  if (totalGeneral <= 0) {
    setError('El total debe ser mayor a 0')
    return
  }

  const itemsInvalidos = itemsSeleccionados.filter(p => !p.item_id)
  if (itemsInvalidos.length > 0) {
    setError('Todos los items deben estar seleccionados')
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

    const ventasCredito = itemsSeleccionados.map(item => ({
      ...(item.tipo === 'producto' 
        ? { producto_id: item.item_id, servicio_id: null }
        : { servicio_id: item.item_id, producto_id: null }),
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      total: calcularTotalItem(item),
      nombre_cliente: clienteNombre,
      fecha_inicio: formData.fecha_inicio,
      fecha_fin: formData.fecha_fin,
      saldo_pendiente: calcularTotalItem(item),
      estado: 'activo',
      tipo_item: item.tipo
    }))

    console.log('Creando ventas a crédito:', ventasCredito)
    
    const { error: errorVentas } = await supabase
      .from('ventas_credito')
      .insert(ventasCredito)
    
    if (errorVentas) throw errorVentas

    // Registrar en facturados (solo productos)
    const facturasProductos = ventasCredito
      .filter(v => v.tipo_item === 'producto')
      .map(venta => ({
        tipo_venta: 'credito',
        producto_id: venta.producto_id,
        cantidad: venta.cantidad,
        precio_unitario: venta.precio_unitario,
        total: venta.total,
        metodo_pago: 'credito',
        fecha: new Date().toISOString()
      }))

    if (facturasProductos.length > 0) {
      const { error: errorFacturas } = await supabase
        .from('facturados')
        .insert(facturasProductos)
      
      if (errorFacturas) {
        console.log('No se pudo registrar en facturados:', errorFacturas)
        // No lanzamos error porque el crédito ya se guardó
      }
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
            
            {/* BÚSQUEDA DE PRODUCTOS/SERVICIOS */}
            <div className="form-grupo">
              <label className="form-label">
                Buscar Producto o Servicio
                <span className="hint-text"> (nombre, categoría, código)</span>
              </label>
              <div className="busqueda-producto-container">
                <input
                  type="text"
                  value={busquedaItem}
                  onChange={(e) => setBusquedaItem(e.target.value)}
                  onFocus={() => {
                    if (busquedaItem.trim()) setMostrarResultados(true)
                  }}
                  className="form-input-busqueda"
                  placeholder="Escribe para buscar..."
                  disabled={loading}
                />
                {busquedaItem && (
                  <button
                    type="button"
                    onClick={() => {
                      setBusquedaItem('')
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
                          <span className="resultado-tipo">
                            {item.tipo === 'servicio' ? ' 💇' : ' 📦'}
                          </span>
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
                      No se encontraron items con "{busquedaItem}"
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Lista de Items */}
            <div className="productos-container">
              <div className="productos-header">
                <h4 className="productos-titulo">Items ({itemsSeleccionados.length})</h4>
                <button
                  type="button"
                  onClick={agregarItemManual}
                  className="btn-agregar-producto"
                  disabled={loading}
                >
                  + Agregar Item
                </button>
              </div>
              
              {itemsSeleccionados.length === 0 ? (
                <div className="sin-productos">
                  <p>No hay items agregados. Busca o agrega productos/servicios.</p>
                </div>
              ) : (
                <div className="lista-productos">
                  {itemsSeleccionados.map((item, index) => (
                    <div key={item.id} className="producto-item">
                      <div className="producto-header">
                        <span className="producto-numero">#{index + 1}</span>
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
                              <strong>
                                {item.item_icono} {item.item_nombre}
                              </strong>
                              {item.item_categoria && (
                                <span className="producto-info-categoria"> ({item.item_categoria})</span>
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
                                placeholder="Buscar item para agregar..."
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
                                        <span className="resultado-tipo">
                                          {p.tipo === 'servicio' ? ' 💇' : ' 📦'}
                                        </span>
                                        {p.categoria && (
                                          <span className="resultado-categoria"> ({p.categoria})</span>
                                        )}
                                      </div>
                                      <div className="resultado-info">
                                        <span className="resultado-precio">C${obtenerPrecioItem(p).toFixed(2)}</span>
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
                                value={item.cantidad || 1}
                                min="1" 
                                max="999"
                                onChange={(e) => actualizarItem(index, 'cantidad', e.target.value)}
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
                              value={item.precio_unitario}
                              onChange={(e) => actualizarItem(index, 'precio_unitario', e.target.value)}
                              className="form-input"
                              disabled={loading || !item.item_id}
                              required
                            />
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
                  <span className="resumen-label">Items:</span>
                  <span className="resumen-valor">
                    {itemsSeleccionados.length} items
                  </span>
                </div>
                <div className="resumen-item">
                  <span className="resumen-label">Total unidades:</span>
                  <span className="resumen-valor">
                    {itemsSeleccionados.reduce((sum, p) => sum + p.cantidad, 0)} unidades
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
              disabled={loading || itemsSeleccionados.length === 0 || !formData.cliente_nombre}
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