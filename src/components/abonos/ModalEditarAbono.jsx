import React, { useState, useEffect } from 'react'
import { supabase } from '../../database/supabase'
import './ModalEditarAbono.css'

const ModalEditarAbono = ({ isOpen, onClose, onAbonoEditado, abono, creditos }) => {
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

  useEffect(() => {
    if (abono && isOpen) {
      // Cargar datos del abono existente
      setFormData({
        venta_credito_id: abono.venta_credito_id,
        metodo_pago: abono.metodo_pago
      })
      
      // Cargar montos separados si existen
      if (abono.efectivo !== undefined) setEfectivo(parseFloat(abono.efectivo) || 0)
      if (abono.tarjeta !== undefined) setTarjeta(parseFloat(abono.tarjeta) || 0)
      if (abono.transferencia !== undefined) setTransferencia(parseFloat(abono.transferencia) || 0)
      
      // Cargar banco según el método de pago
      if (abono.banco) {
        try {
          // Si es mixto, el banco se guarda como JSON
          if (abono.metodo_pago === 'mixto') {
            const bancosMixto = JSON.parse(abono.banco)
            setBancoTarjeta(bancosMixto.tarjeta || '')
            setBancoTransferencia(bancosMixto.transferencia || '')
          } else {
            setBanco(abono.banco || '')
          }
        } catch (err) {
          console.log('Error parsing banco data:', err)
          // Si no es JSON, es un string simple
          setBanco(abono.banco || '')
        }
      }
    }
  }, [abono, isOpen])

  if (!isOpen || !abono) return null

  const creditoSeleccionado = creditos.find(c => c.id === formData.venta_credito_id)
  const creditoOriginal = creditos.find(c => c.id === abono.venta_credito_id)

  // Métodos de pago (actualizado con mixto)
  const metodosPago = [
    { value: 'efectivo', label: 'Efectivo', icon: '💰' },
    { value: 'tarjeta', label: 'Tarjeta', icon: '💳' },
    { value: 'transferencia', label: 'Transferencia', icon: '🏦' },
    { value: 'mixto', label: 'Mixto', icon: '🔄' }
  ]

  // Calcular monto total automáticamente
  const montoTotal = efectivo + tarjeta + transferencia
  const montoAnterior = parseFloat(abono.monto)

  // Manejar cambios en método de pago
  useEffect(() => {
    if (formData.metodo_pago === 'efectivo') {
      // Si cambia a efectivo, mover todo el monto a efectivo
      setEfectivo(montoTotal)
      setTarjeta(0)
      setTransferencia(0)
      setBanco('')
    } else if (formData.metodo_pago === 'tarjeta') {
      // Si cambia a tarjeta, mover todo el monto a tarjeta
      setEfectivo(0)
      setTarjeta(montoTotal)
      setTransferencia(0)
      setBanco('')
    } else if (formData.metodo_pago === 'transferencia') {
      // Si cambia a transferencia, mover todo el monto a transferencia
      setEfectivo(0)
      setTarjeta(0)
      setTransferencia(montoTotal)
      setBanco('')
    }
  }, [formData.metodo_pago])

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
      // Preparar datos para actualizar
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
        // Para mixto, guardamos ambos bancos en un campo JSON
        const bancosMixto = {
          tarjeta: bancoTarjeta || null,
          transferencia: bancoTransferencia || null
        }
        abonoData.banco = JSON.stringify(bancosMixto)
      } else {
        // Para efectivo, limpiar banco
        abonoData.banco = null
      }

      const { error: supabaseError } = await supabase
        .from('abonos_credito')
        .update(abonoData)
        .eq('id', abono.id)
      
      if (supabaseError) throw supabaseError
      
      onAbonoEditado()
      onClose()
    } catch (err) {
      console.error('Error editando abono:', err)
      setError('Error al actualizar el abono. Por favor intenta de nuevo.')
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

  // Obtener información del banco para mostrar en el resumen
  const getBancoInfo = () => {
    if (abono.banco && abono.metodo_pago === 'mixto') {
      try {
        const bancosMixto = JSON.parse(abono.banco)
        const info = []
        if (bancosMixto.tarjeta) info.push(`Tarjeta: ${bancosMixto.tarjeta}`)
        if (bancosMixto.transferencia) info.push(`Transferencia: ${bancosMixto.transferencia}`)
        return info.length > 0 ? info.join(', ') : 'No especificado'
      } catch {
        return abono.banco
      }
    }
    return abono.banco || 'No especificado'
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container-editar-abono">
        <div className="modal-header-editar-abono">
          <div className="modal-titulo-contenedor">
            <svg className="modal-icono-editar" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <h3 className="modal-titulo-editar-abono">Editar Abono</h3>
          </div>
          <button onClick={onClose} className="modal-cerrar-btn" disabled={loading}>
            &times;
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form-abono">
          <div className="modal-contenido-editar-abono">
            {error && (
              <div className="error-mensaje">
                <svg className="error-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            
            <div className="info-abono-actual">
              <h4 className="venta-original-titulo">ABONO ORIGINAL:</h4>
              <div className="venta-original-detalles">
                <div className="resumen-item">
                  <span className="resumen-label">Cliente:</span>
                  <span className="resumen-valor">
                    <strong>{creditoOriginal?.nombre_cliente || 'No encontrado'}</strong>
                  </span>
                </div>
                <div className="resumen-item">
                  <span className="resumen-label">Monto anterior:</span>
                  <span className="resumen-valor">
                    <strong>C${montoAnterior.toFixed(2)}</strong>
                  </span>
                </div>
                <div className="resumen-item">
                  <span className="resumen-label">Método de pago:</span>
                  <span className="resumen-valor">
                    {abono.metodo_pago ? abono.metodo_pago.charAt(0).toUpperCase() + abono.metodo_pago.slice(1) : 'No especificado'}
                  </span>
                </div>
                {abono.banco && (
                  <div className="resumen-item">
                    <span className="resumen-label">Banco:</span>
                    <span className="resumen-valor">{getBancoInfo()}</span>
                  </div>
                )}
                {abono.efectivo > 0 && (
                  <div className="resumen-item">
                    <span className="resumen-label">Efectivo:</span>
                    <span className="resumen-valor">C${parseFloat(abono.efectivo).toFixed(2)}</span>
                  </div>
                )}
                {abono.tarjeta > 0 && (
                  <div className="resumen-item">
                    <span className="resumen-label">Tarjeta:</span>
                    <span className="resumen-valor">C${parseFloat(abono.tarjeta).toFixed(2)}</span>
                  </div>
                )}
                {abono.transferencia > 0 && (
                  <div className="resumen-item">
                    <span className="resumen-label">Transferencia:</span>
                    <span className="resumen-valor">C${parseFloat(abono.transferencia).toFixed(2)}</span>
                  </div>
                )}
                <div className="resumen-item">
                  <span className="resumen-label">Fecha abono:</span>
                  <span className="resumen-valor">
                    {new Date(abono.fecha).toLocaleDateString('es-MX', {
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

            <div className="form-grupo">
              <label className="form-label">
                Crédito *
              </label>
              <select
                value={formData.venta_credito_id}
                onChange={(e) => setFormData({...formData, venta_credito_id: e.target.value})}
                className="form-select"
                disabled={loading}
              >
                <option value="">Selecciona un crédito</option>
                {creditos.map((credito) => (
                  <option key={credito.id} value={credito.id}>
                    {credito.nombre_cliente} - {credito.productos?.nombre} (Total: C${credito.total})
                  </option>
                ))}
              </select>
            </div>
            
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
                    <strong>C${parseFloat(creditoSeleccionado.total).toFixed(2)}</strong>
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
                  Nuevo Monto *
                </label>
                <div className="input-group-monto">
                  <span className="monto-simbolo">C$</span>
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
                      <span className="monto-simbolo">C$</span>
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
                      <span className="monto-simbolo">C$</span>
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
                      <span className="monto-simbolo">C$</span>
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
                    <span className="resumen-mixto-valor">C${montoTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Resumen del Abono Actualizado */}
            <div className="resumen-abono-container">
              <h4 className="resumen-abono-titulo">Abono Actualizado:</h4>
              
              {creditoSeleccionado ? (
                <div className="resumen-detalles">
                  <div className="resumen-item">
                    <span className="resumen-label">Monto anterior:</span>
                    <span className="resumen-valor">C${montoAnterior.toFixed(2)}</span>
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
                        <span className="resumen-valor">C${efectivo.toFixed(2)}</span>
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
                    <span className="resumen-label">Monto actualizado:</span>
                    <span className="resumen-valor-total">
                      C${montoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="resumen-item diferencia-item">
                    <span className="resumen-label">Diferencia con original:</span>
                    <span className={`diferencia-valor ${montoTotal > montoAnterior ? 'diferencia-positiva' : 'diferencia-negativa'}`}>
                      C${(montoTotal - montoAnterior).toFixed(2)}
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
          
          <div className="modal-footer-editar-abono">
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
                  Actualizando...
                </>
              ) : (
                <>
                  <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M5 13l4 4L19 7" />
                  </svg>
                  Actualizar Abono
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalEditarAbono