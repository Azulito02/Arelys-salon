import React, { useState, useEffect } from 'react'
import { supabase } from '../../database/supabase'
import './ModalAgregarCredito.css'

const ModalAgregarCredito = ({ isOpen, onClose, onCreditoAgregado, productos }) => {
  const [formData, setFormData] = useState({
    cliente_nombre: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  })
  
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
    setError('')
  }

  // Agregar producto a la lista
  const agregarProducto = () => {
    setProductosSeleccionados([
      ...productosSeleccionados,
      { id: Date.now(), producto_id: '', cantidad: 1, precio_unitario: 0 }
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
        producto_nombre: producto?.nombre
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
        // Si ya existe, usar el existente
        const clienteId = typeof clienteExistente === 'object' ? clienteExistente.id : clienteExistente
        setFormData({ ...formData, cliente_nombre: clienteId })
        setMostrarNuevoCliente(false)
        return clienteId
      }

      // Intentar registrar en tabla clientes si existe
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

      // Si no existe tabla clientes, usar el nombre directamente
      setFormData({ ...formData, cliente_nombre: nuevoCliente.nombre.trim() })
      setMostrarNuevoCliente(false)
      return nuevoCliente.nombre.trim()
      
    } catch (err) {
      console.error('Error registrando cliente:', err)
      setError('Error al registrar el cliente: ' + err.message)
      return null
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validaciones
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

    // Validar que todos los productos tengan producto_id
    const productosInvalidos = productosSeleccionados.filter(p => !p.producto_id)
    if (productosInvalidos.length > 0) {
      setError('Todos los productos deben estar seleccionados')
      return
    }

    setLoading(true)
    setError('')

    try {
      let clienteNombre = formData.cliente_nombre
      
      // Si es un ID de cliente (UUID), obtener el nombre
      if (clienteNombre.includes('-')) { // UUID tiene guiones
        const cliente = clientes.find(c => c.id === clienteNombre)
        if (cliente) {
          clienteNombre = cliente.nombre
        }
      }

      // Crear UNA venta a crédito por CADA producto (manteniendo compatibilidad)
      const ventasCredito = productosSeleccionados.map(producto => ({
        producto_id: producto.producto_id,
        cantidad: producto.cantidad,
        precio_unitario: producto.precio_unitario,
        total: calcularTotalProducto(producto),
        nombre_cliente: clienteNombre,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        saldo_pendiente: calcularTotalProducto(producto), // Saldo inicial = total
        estado: 'activo'
      }))

      console.log('Creando ventas a crédito:', ventasCredito)
      
      const { error: errorVentas } = await supabase
        .from('ventas_credito')
        .insert(ventasCredito)
      
      if (errorVentas) throw errorVentas

      // También insertar en facturados si existe
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
            
            {/* Lista de Productos */}
            <div className="productos-container">
              <div className="productos-header">
                <h4 className="productos-titulo">Productos</h4>
                <button
                  type="button"
                  onClick={agregarProducto}
                  className="btn-agregar-producto"
                  disabled={loading}
                >
                  + Agregar Producto
                </button>
              </div>
              
              {productosSeleccionados.length === 0 ? (
                <div className="sin-productos">
                  <p>No hay productos agregados</p>
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
                          <select
                            value={producto.producto_id}
                            onChange={(e) => actualizarProducto(index, 'producto_id', e.target.value)}
                            className="form-select"
                            disabled={loading}
                            required
                          >
                            <option value="">Selecciona un producto</option>
                            {productos.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.nombre} - ${p.precio?.toFixed(2) || '0.00'}
                                {p.categoria && ` (${p.categoria})`}
                              </option>
                            ))}
                          </select>
                          
                          <div className="producto-cantidad-precio">
                            <div>
                              <label>Cantidad</label>
                              <input
                                type="number"
                                min="1"
                                value={producto.cantidad}
                                onChange={(e) => actualizarProducto(index, 'cantidad', e.target.value)}
                                className="form-input"
                                disabled={loading}
                                required
                              />
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
                                disabled={loading}
                                required
                              />
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
                    ${calcularTotalGeneral().toLocaleString('es-MX', { minimumFractionDigits: 2 })}
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