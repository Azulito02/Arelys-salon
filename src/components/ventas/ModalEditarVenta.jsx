import React, { useState, useEffect } from 'react'
import './ModalEditarVenta.css'

const ModalEditarVenta = ({
  isOpen,
  onClose,
  onSave,
  venta,
  productos
}) => {
  // TODOS LOS HOOKS DEBEN ESTAR AQUÍ, ANTES DE CUALQUIER RETURN
  
  const [formData, setFormData] = useState({
    producto_id: '',
    cantidad: 1,
    precio_unitario: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
  
  // Estado para banco específico en método mixto
  const [bancoTarjeta, setBancoTarjeta] = useState('')
  const [bancoTransferencia, setBancoTransferencia] = useState('')

  // Debug: Verificar datos recibidos
  console.log('ModalEditarVenta - isOpen:', isOpen)
  console.log('ModalEditarVenta - venta:', venta)
  console.log('ModalEditarVenta - productos:', productos)

  // Cargar datos de la venta al abrir el modal
  useEffect(() => {
    console.log('useEffect ejecutado - venta:', venta)
    if (venta && isOpen) {
      console.log('Cargando datos de venta:', {
        producto_id: venta.producto_id,
        cantidad: venta.cantidad,
        precio_unitario: venta.precio_unitario,
        metodo_pago: venta.metodo_pago,
        efectivo: venta.efectivo,
        tarjeta: venta.tarjeta,
        transferencia: venta.transferencia,
        banco: venta.banco
      })
      
      setFormData({
        producto_id: venta.producto_id || '',
        cantidad: venta.cantidad || 1,
        precio_unitario: venta.precio_unitario || 0
      })
      setMetodoPago(venta.metodo_pago || 'efectivo')
      
      // Cargar montos separados
      setEfectivo(venta.efectivo || 0)
      setTarjeta(venta.tarjeta || 0)
      setTransferencia(venta.transferencia || 0)
      
      // Cargar banco según el método de pago
      if (venta.banco) {
        try {
          // Si es mixto, el banco se guarda como JSON
          if (venta.metodo_pago === 'mixto') {
            const bancosMixto = JSON.parse(venta.banco)
            setBancoTarjeta(bancosMixto.tarjeta || '')
            setBancoTransferencia(bancosMixto.transferencia || '')
            console.log('Bancos mixto cargados:', { bancoTarjeta, bancoTransferencia })
          } else {
            setBanco(venta.banco || '')
            console.log('Banco simple cargado:', venta.banco)
          }
        } catch (err) {
          console.log('Error parsing banco data:', err)
          // Si no es JSON, es un string simple
          setBanco(venta.banco || '')
        }
      }
      setError('')
    }
  }, [venta, isOpen])

  // Calcular totales
  const total = formData.cantidad * formData.precio_unitario
  const totalPagos = efectivo + tarjeta + transferencia
  const montoAnterior = parseFloat(venta?.total || 0)

  // Manejar cambios en método de pago
  useEffect(() => {
    if (metodoPago === 'efectivo') {
      // Si cambia a efectivo, mover todo el monto a efectivo
      setEfectivo(totalPagos)
      setTarjeta(0)
      setTransferencia(0)
      setBanco('')
    } else if (metodoPago === 'tarjeta') {
      // Si cambia a tarjeta, mover todo el monto a tarjeta
      setEfectivo(0)
      setTarjeta(totalPagos)
      setTransferencia(0)
      setBanco('')
    } else if (metodoPago === 'transferencia') {
      // Si cambia a transferencia, mover todo el monto a transferencia
      setEfectivo(0)
      setTarjeta(0)
      setTransferencia(totalPagos)
      setBanco('')
    }
  }, [metodoPago, totalPagos])

  // AHORA SÍ LOS RETURNS CONDICIONALES
  if (!isOpen) {
    console.log('No está abierto, retornando null')
    return null
  }
  
  if (!venta) {
    console.log('No hay venta, mostrando modal de error')
    return (
      <div className="modal-overlay">
        <div className="modal-container-nueva-venta">
          <div className="modal-header-nueva-venta">
            <div className="modal-titulo-contenedor">
              <svg className="modal-icono-nuevo" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <h3 className="modal-titulo-nueva-venta">
                Editar Venta
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
          
          <div className="modal-contenido-nueva-venta">
            <div className="error-mensaje">
              <svg className="error-icono" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <strong>Error al cargar la venta</strong>
                <p>No se pudo cargar la información de la venta. Por favor, cierra este modal y vuelve a intentar.</p>
              </div>
            </div>
          </div>
          
          <div className="modal-footer-nueva-venta">
            <button
              type="button"
              onClick={onClose}
              className="btn-secundario"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Resto del componente...
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.producto_id) {
      setError('Selecciona un producto')
      return
    }

    if (formData.cantidad < 1) {
      setError('La cantidad debe ser mayor a 0')
      return
    }

    if (formData.precio_unitario <= 0) {
      setError('El precio debe ser mayor a 0')
      return
    }

    // Validar que haya al menos un monto positivo
    if (totalPagos <= 0) {
      setError('El monto de la venta debe ser mayor a 0')
      return
    }

    // Validar que los montos coincidan con el total
    if (Math.abs(totalPagos - total) > 0.01) {
      setError(`El total de pagos (C$${totalPagos.toFixed(2)}) no coincide con el total de la venta (C$${total.toFixed(2)})`)
      return
    }

    // Validar banco para tarjeta/transferencia
    if (metodoPago === 'tarjeta' && !banco) {
      setError('Selecciona un banco para pago con tarjeta')
      return
    }

    if (metodoPago === 'transferencia' && !banco) {
      setError('Selecciona un banco para pago con transferencia')
      return
    }

    // Validar bancos para método mixto
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
      // Preparar datos para actualizar
      const datosActualizados = {
        producto_id: formData.producto_id,
        cantidad: parseInt(formData.cantidad),
        precio_unitario: parseFloat(formData.precio_unitario),
        total: total,
        metodo_pago: metodoPago,
        efectivo: parseFloat(efectivo),
        tarjeta: parseFloat(tarjeta),
        transferencia: parseFloat(transferencia)
      }

      // Agregar banco según el método de pago
      if (metodoPago === 'tarjeta' || metodoPago === 'transferencia') {
        datosActualizados.banco = banco
      } else if (metodoPago === 'mixto') {
        // Para mixto, guardamos ambos bancos en un campo JSON
        const bancosMixto = {
          tarjeta: bancoTarjeta || null,
          transferencia: bancoTransferencia || null
        }
        datosActualizados.banco = JSON.stringify(bancosMixto)
      } else {
        // Para efectivo, limpiar banco
        datosActualizados.banco = null
      }
      
      console.log('Actualizando venta con datos:', datosActualizados)
      await onSave(datosActualizados)
    } catch (error) {
      setError('Error al actualizar la venta: ' + error.message)
      console.error('Error al actualizar:', error)
    } finally {
      setLoading(false)
    }
  }

  // Manejar cambio en método de pago simple
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

  const productoSeleccionado = productos.find(p => p.id === formData.producto_id)
  const productoOriginal = venta.productos || {}

  // Obtener información del banco para mostrar en el resumen
  const getBancoInfo = () => {
    if (venta.banco && venta.metodo_pago === 'mixto') {
      try {
        const bancosMixto = JSON.parse(venta.banco)
        const info = []
        if (bancosMixto.tarjeta) info.push(`Tarjeta: C${bancosMixto.tarjeta}`)
        if (bancosMixto.transferencia) info.push(`Transferencia: C${bancosMixto.transferencia}`)
        return info.length > 0 ? info.join(', ') : 'No especificado'
      } catch {
        return venta.banco
      }
    }
    return venta.banco || 'No especificado'
  }

  console.log('Renderizando modal con datos:', {
    formData,
    metodoPago,
    banco,
    efectivo,
    tarjeta,
    transferencia,
    total,
    totalPagos
  })

  return (
    <div className="modal-overlay">
      <div className="modal-container-nueva-venta">
        <div className="modal-header-nueva-venta">
          <div className="modal-titulo-contenedor">
            <svg className="modal-icono-nuevo" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <h3 className="modal-titulo-nueva-venta">
              Editar Venta
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
            {/* Mostrar error */}
            {error && (
              <div className="error-mensaje">
                <svg className="error-icono" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
            
            {/* Información de la venta original */}
            <div className="venta-original-info">
              <h4 className="venta-original-titulo">VENTA ORIGINAL:</h4>
              <div className="venta-original-detalles">
                <div className="resumen-item">
                  <span className="resumen-label">Producto:</span>
                  <span className="resumen-valor">
                    <strong>{productoOriginal.nombre || 'Producto no encontrado'}</strong>
                  </span>
                </div>
                <div className="resumen-item">
                  <span className="resumen-label">Cantidad:</span>
                  <span className="resumen-valor">
                    <strong>{venta.cantidad || 0} unidades</strong>
                  </span>
                </div>
                <div className="resumen-item">
                  <span className="resumen-label">Precio unitario:</span>
                  <span className="resumen-valor">
                    <strong>C${venta.precio_unitario?.toFixed(2) || '0.00'}</strong>
                  </span>
                </div>
                <div className="resumen-item">
                  <span className="resumen-label">Total:</span>
                  <span className="resumen-valor-total">
                    C${montoAnterior.toFixed(2)}
                  </span>
                </div>
                <div className="resumen-item">
                  <span className="resumen-label">Método de pago:</span>
                  <span className="resumen-valor">
                    {venta.metodo_pago ? venta.metodo_pago.charAt(0).toUpperCase() + venta.metodo_pago.slice(1) : 'No especificado'}
                  </span>
                </div>
                {venta.banco && (
                  <div className="resumen-item">
                    <span className="resumen-label">Banco:</span>
                    <span className="resumen-valor">{getBancoInfo()}</span>
                  </div>
                )}
                {venta.efectivo > 0 && (
                  <div className="resumen-item">
                    <span className="resumen-label">Efectivo:</span>
                    <span className="resumen-valor">C${parseFloat(venta.efectivo || 0).toFixed(2)}</span>
                  </div>
                )}
                {venta.tarjeta > 0 && (
                  <div className="resumen-item">
                    <span className="resumen-label">Tarjeta:</span>
                    <span className="resumen-valor">C${parseFloat(venta.tarjeta || 0).toFixed(2)}</span>
                  </div>
                )}
                {venta.transferencia > 0 && (
                  <div className="resumen-item">
                    <span className="resumen-label">Transferencia:</span>
                    <span className="resumen-valor">C${parseFloat(venta.transferencia || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="resumen-item">
                  <span className="resumen-label">Fecha venta:</span>
                  <span className="resumen-valor">
                    {new Date(venta.fecha).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="separador-modal">
              <span className="separador-texto">Nuevos Datos</span>
            </div>

            {/* Formulario de edición */}
            <div className="form-grupo">
              <label className="form-label">
                Producto *
              </label>
              <select
                value={formData.producto_id}
                onChange={(e) => {
                  const productoId = e.target.value
                  const producto = productos.find(p => p.id === productoId)
                  setFormData({
                    ...formData,
                    producto_id: productoId,
                    precio_unitario: producto?.precio || formData.precio_unitario
                  })
                  setError('')
                }}
                className="form-select"
                disabled={loading}
                required
              >
                <option value="">Selecciona un producto</option>
                {productos.map((producto) => (
                  <option key={producto.id} value={producto.id}>
                    {producto.nombre} - C${producto.precio?.toFixed(2)}
                    {producto.categoria && ` (C${producto.categoria})`}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-grupo">
              <label className="form-label">
                Nueva Cantidad *
              </label>
              <div className="input-group-cantidad">
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    cantidad: Math.max(1, formData.cantidad - 1)
                  })}
                  className="cantidad-btn"
                  disabled={loading}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={formData.cantidad}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1
                    setFormData({...formData, cantidad: Math.max(1, value)})
                    setError('')
                  }}
                  className="form-input-cantidad"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    cantidad: formData.cantidad + 1
                  })}
                  className="cantidad-btn"
                  disabled={loading}
                >
                  +
                </button>
              </div>
            </div>
            
            <div className="form-grupo">
              <label className="form-label">
                Nuevo Precio Unitario *
              </label>
              <div className="input-group-precio">
                <span className="precio-simbolo">C$</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.precio_unitario}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0
                    setFormData({...formData, precio_unitario: Math.max(0.01, value)})
                    setError('')
                  }}
                  className="form-input-precio"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Método de Pago */}
            <div className="form-grupo">
              <label className="form-label">
                Método de Pago *
              </label>
              <div className="metodos-pago-grid">
                {metodosPago.map((metodo) => (
                  <button
                    key={metodo.value}
                    type="button"
                    className={`metodo-pago-btn C${metodoPago === metodo.value ? 'metodo-pago-seleccionado' : ''}`}
                    onClick={() => {
                      setMetodoPago(metodo.value)
                      setError('')
                    }}
                    disabled={loading}
                  >
                    <span className="metodo-pago-icono">{metodo.icon}</span>
                    <span className="metodo-pago-label">{metodo.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Para métodos simples (efectivo, tarjeta, transferencia) */}
            {metodoPago !== 'mixto' && (
              <div className="form-grupo">
                <label className="form-label">
                  Monto a Pagar *
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
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Banco para tarjeta o transferencia simple */}
            {(metodoPago === 'tarjeta' || metodoPago === 'transferencia') && (
              <div className="form-grupo">
                <label className="form-label">
                  Banco *
                </label>
                <select
                  value={banco}
                  onChange={(e) => {
                    setBanco(e.target.value)
                    setError('')
                  }}
                  className="form-select"
                  disabled={loading}
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
                        disabled={loading}
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
                        disabled={loading}
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
                        disabled={loading}
                        style={{ marginTop: '0.5rem' }}
                      >
                        <option value="">Banco para tarjeta</option>
                        {bancosDisponibles.map((bancoItem) => (
                          <option key={`tarjeta-C${bancoItem}`} value={bancoItem}>
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
                        disabled={loading}
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
                        disabled={loading}
                        style={{ marginTop: '0.5rem' }}
                      >
                        <option value="">Banco para transferencia</option>
                        {bancosDisponibles.map((bancoItem) => (
                          <option key={`transferencia-C${bancoItem}`} value={bancoItem}>
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
                    <span className="resumen-mixto-valor">C${total.toFixed(2)}</span>
                  </div>
                  <div className="resumen-mixto-item">
                    <span className="resumen-mixto-label">Total pagos:</span>
                    <span className="resumen-mixto-valor">C${totalPagos.toFixed(2)}</span>
                  </div>
                  <div className={`resumen-mixto-item C${Math.abs(total - totalPagos) < 0.01 ? 'resumen-correcto' : 'resumen-error'}`}>
                    <span className="resumen-mixto-label">Diferencia:</span>
                    <span className="resumen-mixto-valor">C${(total - totalPagos).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Resumen de la venta actualizada */}
            <div className="resumen-venta-container">
              <h4 className="resumen-venta-titulo">Venta Actualizada:</h4>
              
              {productoSeleccionado ? (
                <div className="resumen-detalles">
                  <div className="resumen-item">
                    <span className="resumen-label">Producto:</span>
                    <span className="resumen-valor">{productoSeleccionado.nombre}</span>
                  </div>
                  <div className="resumen-item">
                    <span className="resumen-label">Precio unitario:</span>
                    <span className="resumen-valor">C${formData.precio_unitario.toFixed(2)}</span>
                  </div>
                  <div className="resumen-item">
                    <span className="resumen-label">Cantidad:</span>
                    <span className="resumen-valor">{formData.cantidad} unidades</span>
                  </div>
                  <div className="resumen-item resumen-total">
                    <span className="resumen-label">Nuevo total:</span>
                    <span className="resumen-valor-total">C${total.toFixed(2)}</span>
                  </div>
                  <div className="resumen-item">
                    <span className="resumen-label">Método de pago:</span>
                    <span className="resumen-valor">
                      {metodosPago.find(m => m.value === metodoPago)?.label}
                    </span>
                  </div>
                  
                  {/* Mostrar banco según método */}
                  {metodoPago === 'tarjeta' && banco && (
                    <div className="resumen-item">
                      <span className="resumen-label">Banco (tarjeta):</span>
                      <span className="resumen-valor">{banco}</span>
                    </div>
                  )}
                  
                  {metodoPago === 'transferencia' && banco && (
                    <div className="resumen-item">
                      <span className="resumen-label">Banco (transferencia):</span>
                      <span className="resumen-valor">{banco}</span>
                    </div>
                  )}
                  
                  {/* Mostrar distribución para mixto */}
                  {metodoPago === 'mixto' ? (
                    <>
                      <div className="resumen-item">
                        <span className="resumen-label">Efectivo:</span>
                        <span className="resumen-valor">C${efectivo.toFixed(2)}</span>
                      </div>
                      {tarjeta > 0 && (
                        <div className="resumen-item">
                          <span className="resumen-label">Tarjeta:</span>
                          <span className="resumen-valor">
                            C${tarjeta.toFixed(2)} {bancoTarjeta && `(C${bancoTarjeta})`}
                          </span>
                        </div>
                      )}
                      {transferencia > 0 && (
                        <div className="resumen-item">
                          <span className="resumen-label">Transferencia:</span>
                          <span className="resumen-valor">
                            C${transferencia.toFixed(2)} {bancoTransferencia && `(C${bancoTransferencia})`}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="resumen-item">
                      <span className="resumen-label">Monto:</span>
                      <span className="resumen-valor">
                        C${totalPagos.toFixed(2)}
                        {metodoPago === 'tarjeta' && banco && ` (C${banco})`}
                        {metodoPago === 'transferencia' && banco && ` (C${banco})`}
                      </span>
                    </div>
                  )}
                  
                  <div className="resumen-item diferencia-item">
                    <span className="resumen-label">Diferencia con original:</span>
                    <span className={`diferencia-valor ${total > montoAnterior ? 'diferencia-positiva' : 'diferencia-negativa'}`}>
                      C${(total - montoAnterior).toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="resumen-vacio">
                  <p className="texto-resumen-vacio">Selecciona un producto para ver el resumen</p>
                </div>
              )}
            </div>
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
              disabled={loading || !formData.producto_id || totalPagos <= 0 || Math.abs(total - totalPagos) > 0.01}
            >
              {loading ? (
                <>
                  <div className="spinner-pequeno"></div>
                  Actualizando...
                </>
              ) : (
                <>
                  <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M5 13l4 4L19 7" />
                  </svg>
                  Actualizar Venta
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalEditarVenta