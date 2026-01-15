import React, { useState, useEffect } from 'react'
import { supabase } from '../../database/supabase'
import './ModalAgregarAbono.css'

const ModalAgregarAbono = ({ isOpen, onClose, onAbonoAgregado, creditos }) => {
  const [formData, setFormData] = useState({
    venta_credito_id: '',
    metodo_pago: 'efectivo'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Bancos disponibles (mismos que en ventas)
  const bancosDisponibles = [
    'Lafise',
    'BAC',
    'BAMPRO',
    'Avanz',
    'BDF',
    'Fichosa',
    'Otro'
  ]

  // Estados para métodos de pago
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
      setFormData({
        venta_credito_id: '',
        metodo_pago: 'efectivo'
      })
      setBanco('')
      setEfectivo(0)
      setTarjeta(0)
      setTransferencia(0)
      setBancoTarjeta('')
      setBancoTransferencia('')
      setError('')
    }
  }, [isOpen])

  // Calcular monto total automáticamente
  const montoTotal = efectivo + tarjeta + transferencia

  // Calcular total cuando cambia el método de pago
  useEffect(() => {
    if (formData.metodo_pago === 'efectivo') {
      setEfectivo(montoTotal)
      setTarjeta(0)
      setTransferencia(0)
      setBanco('')
    } else if (formData.metodo_pago === 'tarjeta') {
      setEfectivo(0)
      setTarjeta(montoTotal)
      setTransferencia(0)
      setBanco('')
    } else if (formData.metodo_pago === 'transferencia') {
      setEfectivo(0)
      setTarjeta(0)
      setTransferencia(montoTotal)
      setBanco('')
    }
  }, [formData.metodo_pago])

  if (!isOpen) return null

  const creditoSeleccionado = creditos.find(c => c.id === formData.venta_credito_id)

  // Métodos de pago (actualizado con mixto)
  const metodosPago = [
    { value: 'efectivo', label: 'Efectivo', icon: '💰' },
    { value: 'tarjeta', label: 'Tarjeta', icon: '💳' },
    { value: 'transferencia', label: 'Transferencia', icon: '🏦' },
    { value: 'mixto', label: 'Mixto', icon: '🔄' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.venta_credito_id || montoTotal <= 0) {
      setError('Por favor selecciona un crédito y ingresa un monto válido')
      return
    }

    // Validar que haya al menos un monto positivo
    if (montoTotal <= 0) {
      setError('El monto del abono debe ser mayor a 0')
      return
    }

    // Validar banco según el método de pago
    if (formData.metodo_pago === 'tarjeta' && !banco) {
      setError('Selecciona un banco para pago con tarjeta')
      return
    }

    if (formData.metodo_pago === 'transferencia' && !banco) {
      setError('Selecciona un banco para pago con transferencia')
      return
    }

    // Validar bancos para método mixto
    if (formData.metodo_pago === 'mixto') {
      if (tarjeta > 0 && !bancoTarjeta) {
        setError('Selecciona un banco para el pago con tarjeta en método mixto')
        return
      }
      if (transferencia > 0 && !bancoTransferencia) {
        setError('Selecciona un banco para el pago con transferencia en método mixto')
        return
      }
    }

    // Validar que no exceda el total del crédito
    if (creditoSeleccionado && montoTotal > creditoSeleccionado.total) {
      setError('El monto del abono no puede ser mayor al total del crédito')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Preparar datos para insertar
      const abonoData = {
        venta_credito_id: formData.venta_credito_id,
        monto: montoTotal,
        metodo_pago: formData.metodo_pago,
        efectivo: efectivo,
        tarjeta: tarjeta,
        transferencia: transferencia
      }

      // Agregar banco según el método de pago
      if (formData.metodo_pago === 'tarjeta' || formData.metodo_pago === 'transferencia') {
        abonoData.banco = banco
      } else if (formData.metodo_pago === 'mixto') {
        // Para mixto, podemos guardar ambos bancos en un campo o crear un formato
        // Aquí guardamos como JSON string con ambos bancos
        const bancosMixto = {
          tarjeta: bancoTarjeta || null,
          transferencia: bancoTransferencia || null
        }
        abonoData.banco = JSON.stringify(bancosMixto)
      }

      const { error: supabaseError } = await supabase
        .from('abonos_credito')
        .insert([abonoData])
      
      if (supabaseError) throw supabaseError
      
      // Reset form
      setFormData({
        venta_credito_id: '',
        metodo_pago: 'efectivo'
      })
      setBanco('')
      setEfectivo(0)
      setTarjeta(0)
      setTransferencia(0)
      setBancoTarjeta('')
      setBancoTransferencia('')
      
      onAbonoAgregado()
      onClose()
    } catch (err) {
      console.error('Error agregando abono:', err)
      setError('Error al registrar el abono. Por favor intenta de nuevo.')
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
      <div className="modal-container-nuevo-abono">
        <div className="modal-header-nuevo-abono">
          <div className="modal-titulo-contenedor">
            <svg className="modal-icono-nuevo" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 4v16m8-8H4" />
            </svg>
            <h3 className="modal-titulo-nuevo-abono">Nuevo Abono</h3>
          </div>
          <button onClick={onClose} className="modal-cerrar-btn" disabled={loading}>
            &times;
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form-abono">
          <div className="modal-contenido-nuevo-abono">
            {error && (
              <div className="error-mensaje">
                <svg className="error-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            
            <div className="form-grupo">
              <label className="form-label">
                Crédito *
              </label>
              <select
                value={formData.venta_credito_id}
                onChange={(e) => {
                  setFormData({...formData, venta_credito_id: e.target.value})
                  setError('')
                }}
                className="form-select"
                disabled={loading}
              >
                <option value="">Selecciona un crédito</option>
                {creditos.map((credito) => (
                  <option key={credito.id} value={credito.id}>
                    {credito.nombre_cliente} - {credito.productos?.nombre} (Total: ${credito.total})
                  </option>
                ))}
              </select>
            </div>
            
            {/* Información del crédito seleccionado */}
            {creditoSeleccionado && (
              <div className="credito-info-actualizado">
                <div className="credito-detalles-actualizado">
                  <div className="detalle-item-actualizado">
                    <span>Cliente:</span>
                    <strong>{creditoSeleccionado.nombre_cliente}</strong>
                  </div>
                  <div className="detalle-item-actualizado">
                    <span>Producto:</span>
                    <strong>{creditoSeleccionado.productos?.nombre || 'No especificado'}</strong>
                  </div>
                  <div className="detalle-item-actualizado">
                    <span>Total crédito:</span>
                    <strong>${parseFloat(creditoSeleccionado.total).toFixed(2)}</strong>
                  </div>
                  <div className="detalle-item-actualizado">
                    <span>Fecha fin:</span>
                    <strong>
                      {new Date(creditoSeleccionado.fecha_fin).toLocaleDateString('es-MX')}
                    </strong>
                  </div>
                </div>
              </div>
            )}

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
                    className={`metodo-pago-btn ${formData.metodo_pago === metodo.value ? 'metodo-pago-seleccionado' : ''}`}
                    onClick={() => {
                      setFormData({...formData, metodo_pago: metodo.value})
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
            {formData.metodo_pago !== 'mixto' && (
              <div className="form-grupo">
                <label className="form-label">
                  Monto del Abono *
                </label>
                <div className="input-group-monto">
                  <span className="monto-simbolo">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.metodo_pago === 'efectivo' ? efectivo : 
                           formData.metodo_pago === 'tarjeta' ? tarjeta : 
                           transferencia}
                    onChange={(e) => handleMetodoSimpleChange(formData.metodo_pago, e.target.value)}
                    className="form-input-monto"
                    placeholder="0.00"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Banco para tarjeta o transferencia simple */}
            {(formData.metodo_pago === 'tarjeta' || formData.metodo_pago === 'transferencia') && (
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
                  required={formData.metodo_pago === 'tarjeta' || formData.metodo_pago === 'transferencia'}
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
            {formData.metodo_pago === 'mixto' && (
              <div className="montos-mixtos-container">
                <h4 className="montos-mixtos-titulo">Distribución del Pago:</h4>
                <div className="montos-mixtos-grid">
                  {/* Efectivo */}
                  <div className="form-grupo">
                    <label className="monto-mixto-label">
                      <span className="monto-mixto-label-icono">💰</span>
                      Efectivo:
                    </label>
                    <div className="input-group-monto">
                      <span className="monto-simbolo">$</span>
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
                        className="form-input-monto"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  {/* Tarjeta con banco */}
                  <div className="form-grupo">
                    <label className="monto-mixto-label">
                      <span className="monto-mixto-label-icono">💳</span>
                      Tarjeta:
                    </label>
                    <div className="input-group-monto">
                      <span className="monto-simbolo">$</span>
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
                        className="form-input-monto"
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
                    <label className="monto-mixto-label">
                      <span className="monto-mixto-label-icono">🏦</span>
                      Transferencia:
                    </label>
                    <div className="input-group-monto">
                      <span className="monto-simbolo">$</span>
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
                        className="form-input-monto"
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
                    <span className="resumen-mixto-label">Total del abono:</span>
                    <span className="resumen-mixto-valor">${montoTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Separador visual */}
            <div className="separador-modal"></div>

            {/* Resumen del Abono */}
            <div className="resumen-abono-container">
              <h4 className="resumen-abono-titulo">Resumen del Abono</h4>
              
              {creditoSeleccionado ? (
                <div className="resumen-detalles">
                  <div className="resumen-item">
                    <span className="resumen-label">Cliente:</span>
                    <span className="resumen-valor">{creditoSeleccionado.nombre_cliente}</span>
                  </div>
                  <div className="resumen-item">
                    <span className="resumen-label">Producto:</span>
                    <span className="resumen-valor">{creditoSeleccionado.productos?.nombre || 'No especificado'}</span>
                  </div>
                  <div className="resumen-item">
                    <span className="resumen-label">Método de pago:</span>
                    <span className="resumen-valor">
                      {metodosPago.find(m => m.value === formData.metodo_pago)?.label}
                    </span>
                  </div>
                  
                  {/* Mostrar banco según método */}
                  {formData.metodo_pago === 'tarjeta' && banco && (
                    <div className="resumen-item">
                      <span className="resumen-label">Banco (tarjeta):</span>
                      <span className="resumen-valor">{banco}</span>
                    </div>
                  )}
                  
                  {formData.metodo_pago === 'transferencia' && banco && (
                    <div className="resumen-item">
                      <span className="resumen-label">Banco (transferencia):</span>
                      <span className="resumen-valor">{banco}</span>
                    </div>
                  )}
                  
                  {/* Mostrar distribución para mixto */}
                  {formData.metodo_pago === 'mixto' ? (
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
                      <span className="resumen-label">Monto:</span>
                      <span className="resumen-valor">
                        ${montoTotal.toFixed(2)}
                        {formData.metodo_pago === 'tarjeta' && banco && ` (${banco})`}
                        {formData.metodo_pago === 'transferencia' && banco && ` (${banco})`}
                      </span>
                    </div>
                  )}
                  
                  <div className="resumen-item resumen-total">
                    <span className="resumen-label">Total a abonar:</span>
                    <span className="resumen-valor-total">
                      ${montoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="resumen-item">
                    <span className="resumen-label">Saldo restante:</span>
                    <span className="resumen-valor">
                      ${(parseFloat(creditoSeleccionado.total) - montoTotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="resumen-vacio">
                  <p className="texto-resumen-vacio">Selecciona un crédito para ver el resumen</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="modal-footer-nuevo-abono">
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
              className="btn-primario-abono"
              disabled={loading || montoTotal <= 0}
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
                  Registrar Abono
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalAgregarAbono