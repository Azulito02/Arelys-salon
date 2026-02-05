import React, { useState, useEffect } from 'react'
import './ModalNuevaVenta.css'

const ModalNuevaVenta = ({
  isOpen,
  onClose,
  onSave,
  productos,
  ventaData,
  setVentaData
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [vuelto, setVuelto] = useState(0)

  // Métodos de pago y bancos disponibles
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
      
      // Calcular total inicial basado en datos de venta
      const totalInicial = ventaData.cantidad * ventaData.precio_unitario
      setEfectivo(totalInicial)
    }
  }, [isOpen])

  // Calcular total y vuelto
  const total = ventaData.cantidad * ventaData.precio_unitario
  const totalPagos = efectivo + tarjeta + transferencia
  const diferencia = totalPagos - total

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
      // Si cambia a efectivo, mover todo el monto a efectivo
      setEfectivo(total)
      setTarjeta(0)
      setTransferencia(0)
      setBanco('')
    } else if (metodoPago === 'tarjeta') {
      // Si cambia a tarjeta, mover todo el monto a tarjeta
      setEfectivo(0)
      setTarjeta(total)
      setTransferencia(0)
      setBanco('')
    } else if (metodoPago === 'transferencia') {
      // Si cambia a transferencia, mover todo el monto a transferencia
      setEfectivo(0)
      setTarjeta(0)
      setTransferencia(total)
      setBanco('')
    } else if (metodoPago === 'mixto') {
      // Si cambia a mixto, distribuir el total en efectivo
      setEfectivo(total)
      setTarjeta(0)
      setTransferencia(0)
      setBancoTarjeta('')
      setBancoTransferencia('')
    }
  }, [metodoPago, total])

  // Actualizar montos cuando cambia el total
  useEffect(() => {
    if (metodoPago === 'efectivo') {
      setEfectivo(total)
    } else if (metodoPago === 'tarjeta') {
      setTarjeta(total)
    } else if (metodoPago === 'transferencia') {
      setTransferencia(total)
    } else if (metodoPago === 'mixto') {
      // Mantener la distribución proporcional
      const proporcionEfectivo = totalPagos > 0 ? efectivo / totalPagos : 1
      setEfectivo(total * proporcionEfectivo)
    }
  }, [total])

  if (!isOpen) return null

  // Obtener producto seleccionado
  const productoSeleccionado = productos.find(p => p.id === ventaData.producto_id)

  // Función para Pago Completo (exacto)
  const handlePagoCompleto = () => {
    if (metodoPago === 'efectivo') {
      setEfectivo(total)
    } else if (metodoPago === 'tarjeta') {
      setTarjeta(total)
    } else if (metodoPago === 'transferencia') {
      setTransferencia(total)
    } else if (metodoPago === 'mixto') {
      // Para mixto, poner todo en efectivo como default
      setEfectivo(total)
      setTarjeta(0)
      setTransferencia(0)
    }
  }

  // Función para Pago Excedente (ejemplo: pagar con 1000 para 500)
  const handlePagoConVuelto = (montoRedondo) => {
    if (metodoPago === 'efectivo') {
      // Ejemplo: si total es 470, pagar con 500
      const montoAPagar = Math.ceil(total / montoRedondo) * montoRedondo
      setEfectivo(montoAPagar)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!ventaData.producto_id) {
      setError('Selecciona un producto')
      return
    }

    if (ventaData.cantidad < 1) {
      setError('La cantidad debe ser mayor a 0')
      return
    }

    if (ventaData.precio_unitario <= 0) {
      setError('El precio debe ser mayor a 0')
      return
    }

    // Validar que haya al menos un monto positivo
    if (totalPagos <= 0) {
      setError('El monto de la venta debe ser mayor a 0')
      return
    }

    // Validar que NO se pague menos del total (solo permitir igual o mayor)
    if (totalPagos < total) {
      setError(`El pago ($${totalPagos.toFixed(2)}) es menor al total ($${total.toFixed(2)})`)
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
      // Preparar datos para guardar
      const datosCompletos = {
        producto_id: ventaData.producto_id,
        cantidad: parseInt(ventaData.cantidad),
        precio_unitario: parseFloat(ventaData.precio_unitario),
        total: total,
        fecha: new Date().toISOString(),
        metodo_pago: metodoPago,
        efectivo: parseFloat(efectivo),
        tarjeta: parseFloat(tarjeta),
        transferencia: parseFloat(transferencia),
        vuelto: vuelto > 0 ? parseFloat(vuelto) : 0
      }

      // Agregar banco según el método de pago
      if (metodoPago === 'tarjeta' || metodoPago === 'transferencia') {
        datosCompletos.banco = banco
      } else if (metodoPago === 'mixto') {
        // Para mixto, guardamos ambos bancos en un campo JSON
        const bancosMixto = {
          tarjeta: bancoTarjeta || null,
          transferencia: bancoTransferencia || null
        }
        datosCompletos.banco = JSON.stringify(bancosMixto)
      }
      
      console.log('Guardando venta:', datosCompletos)
      await onSave(datosCompletos)
      
      // Resetear formulario después de guardar
      setVentaData({
        producto_id: '',
        cantidad: 1,
        precio_unitario: 0
      })
      setMetodoPago('efectivo')
      setBanco('')
      setEfectivo(0)
      setTarjeta(0)
      setTransferencia(0)
      setBancoTarjeta('')
      setBancoTransferencia('')
      setVuelto(0)
    } catch (error) {
      setError('Error al registrar la venta: ' + error.message)
      console.error('Error al registrar:', error)
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

  return (
    <div className="modal-overlay">
      <div className="modal-container-nueva-venta">
        <div className="modal-header-nueva-venta">
          <div className="modal-titulo-contenedor">
            <svg className="modal-icono-nuevo" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 4v16m8-8H4" />
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
            {/* Formulario */}
            <div className="form-grupo">
              <label className="form-label">
                Producto **
              </label>
              <select
                value={ventaData.producto_id}
                onChange={(e) => {
                  const productoId = e.target.value
                  const producto = productos.find(p => p.id === productoId)
                  setVentaData({
                    ...ventaData,
                    producto_id: productoId,
                    precio_unitario: producto?.precio || 0
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
                    {producto.nombre} - ${producto.precio?.toFixed(2)}
                    {producto.categoria && ` (${producto.categoria})`}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-grupo">
              <label className="form-label">
                Cantidad **
              </label>
              <div className="input-group-cantidad">
                <button
                  type="button"
                  onClick={() => setVentaData({
                    ...ventaData,
                    cantidad: Math.max(1, ventaData.cantidad - 1)
                  })}
                  className="cantidad-btn"
                  disabled={loading}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={ventaData.cantidad}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1
                    setVentaData({...ventaData, cantidad: Math.max(1, value)})
                    setError('')
                  }}
                  className="form-input-cantidad"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setVentaData({
                    ...ventaData,
                    cantidad: ventaData.cantidad + 1
                  })}
                  className="cantidad-btn"
                  disabled={loading}
                >
                  +
                </button>
              </div>
            </div>
            
            {/* SECCIÓN DE TOTAL CON BOTÓN PAGO COMPLETO Y VUELTO */}
            <div className="total-section">
              <div className="total-container">
                <div className="total-info">
                  <div className="total-label-container">
                    <span className="total-label">TOTAL VENTA:</span>
                    <div className="total-calculation">
                      {ventaData.cantidad} x ${ventaData.precio_unitario.toFixed(2)}
                    </div>
                  </div>
                  <div className="total-amount-container">
                    <span className="total-amount">${total.toFixed(2)}</span>
                    <div className="pago-buttons-container">
                      <button 
                        type="button" 
                        onClick={handlePagoCompleto}
                        className="btn-pago-completo"
                        title="Establecer el monto exacto del total"
                      >
                        Pago Exacto
                      </button>
                      {metodoPago === 'efectivo' && (
                        <div className="pago-con-vuelto-buttons">

                          <button 
                            type="button" 
                            onClick={() => handlePagoConVuelto(10)}
                            className="btn-pago-vuelto"
                            title="Pagar con $10"
                          >
                            Con $10
                          </button>



                          <button 
                            type="button" 
                            onClick={() => handlePagoConVuelto(50)}
                            className="btn-pago-vuelto"
                            title="Pagar con $50"
                          >
                            Con $50
                          </button>

                          <button 
                            type="button" 
                            onClick={() => handlePagoConVuelto(100)}
                            className="btn-pago-vuelto"
                            title="Pagar con $100"
                          >
                            Con $100
                          </button>


                          <button 
                            type="button" 
                            onClick={() => handlePagoConVuelto(200)}
                            className="btn-pago-vuelto"
                            title="Pagar con $200"
                          >
                            Con $200
                          </button>


                          <button 
                            type="button" 
                            onClick={() => handlePagoConVuelto(500)}
                            className="btn-pago-vuelto"
                            title="Pagar con $500"
                          >
                            Con $500
                          </button>

                          <button 
                            type="button" 
                            onClick={() => handlePagoConVuelto(1000)}
                            className="btn-pago-vuelto"
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
                      Se pagó ${totalPagos.toFixed(2)} - Total ${total.toFixed(2)}
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
                    disabled={loading}
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
                    <span className="resumen-mixto-valor">${total.toFixed(2)}</span>
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

            {/* Separador visual */}
            <div className="separador-modal"></div>

            {/* Resumen de Venta */}
            <div className="resumen-venta-container">
              <h4 className="resumen-venta-titulo">Resumen de Venta:</h4>
              
              {productoSeleccionado ? (
                <div className="resumen-detalles">
                  <div className="resumen-item">
                    <span className="resumen-label">Producto:</span>
                    <span className="resumen-valor">{productoSeleccionado.nombre}</span>
                  </div>
                  <div className="resumen-item">
                    <span className="resumen-label">Precio unitario:</span>
                    <span className="resumen-valor">${ventaData.precio_unitario.toFixed(2)}</span>
                  </div>
                  <div className="resumen-item">
                    <span className="resumen-label">Cantidad:</span>
                    <span className="resumen-valor">{ventaData.cantidad} unidades</span>
                  </div>
                  <div className="resumen-item resumen-total">
                    <span className="resumen-label">Total:</span>
                    <span className="resumen-valor-total">${total.toFixed(2)}</span>
                  </div>
                  
                  {vuelto > 0 && (
                    <div className="resumen-item resumen-vuelto">
                      <span className="resumen-label">Vuelto:</span>
                      <span className="resumen-valor">${vuelto.toFixed(2)}</span>
                    </div>
                  )}
                  
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
                        <span className="resumen-valor">${efectivo.toFixed(2)}</span>
                      </div>
                      {tarjeta > 0 && (
                        <div className="resumen-item">
                          <span className="resumen-label">Tarjeta:</span>
                          <span className="resumen-valor">
                            ${tarjeta.toFixed(2)} {bancoTarjeta && `(${bancoTarjeta})`}
                          </span>
                        </div>
                      )}
                      {transferencia > 0 && (
                        <div className="resumen-item">
                          <span className="resumen-label">Transferencia:</span>
                          <span className="resumen-valor">
                            ${transferencia.toFixed(2)} {bancoTransferencia && `(${bancoTransferencia})`}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="resumen-item">
                      <span className="resumen-label">Monto recibido:</span>
                      <span className="resumen-valor">
                        ${totalPagos.toFixed(2)}
                        {metodoPago === 'tarjeta' && banco && ` (${banco})`}
                        {metodoPago === 'transferencia' && banco && ` (${banco})`}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="resumen-vacio">
                  <p className="texto-resumen-vacio">Selecciona un producto para ver el resumen</p>
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
              disabled={loading || !ventaData.producto_id || totalPagos < total}
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