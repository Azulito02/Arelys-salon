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
  const [vuelto, setVuelto] = useState(0)
  
  // 🔍 ESTADOS PARA EL BUSCADOR DE CRÉDITOS
  const [busqueda, setBusqueda] = useState('')
  const [creditosFiltrados, setCreditosFiltrados] = useState([])
  const [mostrarResultados, setMostrarResultados] = useState(false)

  // Bancos disponibles
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
      setBusqueda('')
      setCreditosFiltrados([])
      setMostrarResultados(false)
      setBanco('')
      setEfectivo(0)
      setTarjeta(0)
      setTransferencia(0)
      setBancoTarjeta('')
      setBancoTransferencia('')
      setError('')
      setVuelto(0)
    }
  }, [isOpen])

  // 🔍 FILTRAR CRÉDITOS POR BÚSQUEDA
  useEffect(() => {
    if (busqueda.trim() === '') {
      setCreditosFiltrados([])
      setMostrarResultados(false)
      return
    }

    const termino = busqueda.toLowerCase().trim()
    
    const filtrados = creditos.filter(credito => {
      // Solo créditos con saldo pendiente > 0
      const saldoDisponible = credito.saldo_pendiente !== undefined 
        ? credito.saldo_pendiente 
        : credito.total || 0
      
      if (saldoDisponible <= 0) return false
      
      const nombreCliente = credito.nombre_cliente?.toLowerCase() || ''
      const nombreProducto = credito.productos?.nombre?.toLowerCase() || ''
      
      return nombreCliente.includes(termino) || nombreProducto.includes(termino)
    })
    
    setCreditosFiltrados(filtrados)
    setMostrarResultados(true)
  }, [busqueda, creditos])

  // Calcular monto total automáticamente
  const montoTotal = efectivo + tarjeta + transferencia

  // Calcular vuelto automáticamente
  useEffect(() => {
    const creditoSeleccionado = creditos.find(c => c.id === formData.venta_credito_id)
    if (creditoSeleccionado) {
      const saldoDisponible = creditoSeleccionado.saldo_pendiente !== undefined 
        ? creditoSeleccionado.saldo_pendiente 
        : creditoSeleccionado.total || 0
      
      const montoAbono = Math.min(montoTotal, saldoDisponible)
      const vueltoCalculado = montoTotal > montoAbono ? montoTotal - montoAbono : 0
      setVuelto(vueltoCalculado)
    }
  }, [montoTotal, formData.venta_credito_id, creditos])

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
  
  // Calcular saldo disponible (saldo_pendiente si existe, sino total)
  const saldoDisponible = creditoSeleccionado?.saldo_pendiente !== undefined 
    ? creditoSeleccionado.saldo_pendiente 
    : creditoSeleccionado?.total || 0

  // Monto del abono (el mínimo entre el monto pagado y el saldo disponible)
  const montoAbono = Math.min(montoTotal, saldoDisponible)

  // Métodos de pago
  const metodosPago = [
    { value: 'efectivo', label: 'Efectivo', icon: '💰' },
    { value: 'tarjeta', label: 'Tarjeta', icon: '💳' },
    { value: 'transferencia', label: 'Transferencia', icon: '🏦' },
    { value: 'mixto', label: 'Mixto', icon: '🔄' }
  ]

  // 🔍 SELECCIONAR CRÉDITO DESDE BÚSQUEDA
  const seleccionarCredito = (credito) => {
    setFormData({...formData, venta_credito_id: credito.id})
    setBusqueda(`${credito.nombre_cliente} - ${credito.productos?.nombre || ''}`)
    setCreditosFiltrados([])
    setMostrarResultados(false)
    setError('')
  }

  // Función para Abono Completo (exacto)
  const handleAbonoCompleto = () => {
    if (formData.metodo_pago === 'efectivo') {
      setEfectivo(saldoDisponible)
    } else if (formData.metodo_pago === 'tarjeta') {
      setTarjeta(saldoDisponible)
    } else if (formData.metodo_pago === 'transferencia') {
      setTransferencia(saldoDisponible)
    } else if (formData.metodo_pago === 'mixto') {
      setEfectivo(saldoDisponible)
      setTarjeta(0)
      setTransferencia(0)
    }
  }

  // Función para Pago Excedente (ejemplo: pagar con 1000 para abonar 500)
  const handlePagoConVuelto = (montoRedondo) => {
    if (formData.metodo_pago === 'efectivo') {
      const montoAPagar = Math.ceil(saldoDisponible / montoRedondo) * montoRedondo
      setEfectivo(montoAPagar)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.venta_credito_id || montoAbono <= 0) {
      setError('Por favor selecciona un crédito y ingresa un monto válido')
      return
    }

    if (montoAbono <= 0) {
      setError('El monto del abono debe ser mayor a 0')
      return
    }

    if (montoTotal < montoAbono) {
      setError(`El pago ($${montoTotal.toFixed(2)}) es menor al monto del abono ($${montoAbono.toFixed(2)})`)
      return
    }

    if (formData.metodo_pago === 'tarjeta' && !banco) {
      setError('Selecciona un banco para pago con tarjeta')
      return
    }

    if (formData.metodo_pago === 'transferencia' && !banco) {
      setError('Selecciona un banco para pago con transferencia')
      return
    }

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

    if (montoAbono > saldoDisponible) {
      setError(`El monto del abono ($${montoAbono.toFixed(2)}) no puede ser mayor al saldo disponible ($${saldoDisponible.toFixed(2)})`)
      return
    }

    setLoading(true)
    setError('')

    try {
      const abonoData = {
        venta_credito_id: formData.venta_credito_id,
        monto: montoAbono,
        metodo_pago: formData.metodo_pago,
        efectivo: efectivo,
        tarjeta: tarjeta,
        transferencia: transferencia,
        vuelto: vuelto
      }

      if (formData.metodo_pago === 'tarjeta' || formData.metodo_pago === 'transferencia') {
        abonoData.banco = banco
      } else if (formData.metodo_pago === 'mixto') {
        const bancosMixto = {
          tarjeta: bancoTarjeta || null,
          transferencia: bancoTransferencia || null
        }
        abonoData.banco = JSON.stringify(bancosMixto)
      }

      console.log('Guardando abono:', abonoData)
      const { error: supabaseError } = await supabase
        .from('abonos_credito')
        .insert([abonoData])
      
      if (supabaseError) throw supabaseError
      
      const nuevoSaldo = saldoDisponible - montoAbono
      const { error: updateError } = await supabase
        .from('ventas_credito')
        .update({ saldo_pendiente: nuevoSaldo })
        .eq('id', formData.venta_credito_id)
      
      if (updateError) console.log('Error actualizando saldo:', updateError)
      
      setFormData({
        venta_credito_id: '',
        metodo_pago: 'efectivo'
      })
      setBusqueda('')
      setCreditosFiltrados([])
      setBanco('')
      setEfectivo(0)
      setTarjeta(0)
      setTransferencia(0)
      setBancoTarjeta('')
      setBancoTransferencia('')
      setVuelto(0)
      
      onAbonoAgregado()
      onClose()
    } catch (err) {
      console.error('Error agregando abono:', err)
      setError('Error al registrar el abono. Por favor intenta de nuevo.')
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
            
            {/* 🔍 BUSCADOR DE CRÉDITOS (REEMPLAZA AL SELECT) */}
            <div className="form-grupo">
              <label className="form-label">
                Buscar Crédito *
              </label>
              <div className="busqueda-credito-container">
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onFocus={() => busqueda.trim() && setMostrarResultados(true)}
                  className="form-input-busqueda"
                  placeholder="Buscar por cliente o producto..."
                  disabled={loading}
                  autoComplete="off"
                />
                {busqueda && (
                  <button
                    type="button"
                    onClick={() => {
                      setBusqueda('')
                      setFormData({...formData, venta_credito_id: ''})
                      setCreditosFiltrados([])
                      setMostrarResultados(false)
                    }}
                    className="boton-limpiar-busqueda"
                  >
                    ×
                  </button>
                )}
                
                {/* RESULTADOS DE BÚSQUEDA */}
                {mostrarResultados && creditosFiltrados.length > 0 && (
                  <div className="resultados-busqueda">
                    {creditosFiltrados.slice(0, 5).map((credito) => {
                      const saldo = credito.saldo_pendiente !== undefined 
                        ? credito.saldo_pendiente 
                        : credito.total || 0
                      return (
                        <div
                          key={credito.id}
                          className="resultado-item"
                          onClick={() => seleccionarCredito(credito)}
                        >
                          <div className="resultado-nombre">
                            <strong>{credito.nombre_cliente}</strong>
                            {credito.productos?.categoria && (
                              <span className="resultado-categoria"> ({credito.productos.categoria})</span>
                            )}
                          </div>
                          <div className="resultado-info">
                            <span className="resultado-producto">{credito.productos?.nombre || 'Producto no encontrado'}</span>
                            <span className="resultado-saldo">Saldo: ${saldo.toFixed(2)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                
                {mostrarResultados && creditosFiltrados.length === 0 && busqueda.trim() !== '' && (
                  <div className="resultados-busqueda">
                    <div className="resultado-vacio">
                      No se encontraron créditos con saldo pendiente para "{busqueda}"
                    </div>
                  </div>
                )}
              </div>
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
                    <span>Saldo disponible:</span>
                    <strong className={saldoDisponible > 0 ? 'text-green-600' : 'text-gray-600'}>
                      ${saldoDisponible.toFixed(2)}
                      {saldoDisponible <= 0 && ' (Pagado)'}
                    </strong>
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

            {/* SECCIÓN DE ABONO CON BOTÓN ABONO COMPLETO Y VUELTO */}
            {creditoSeleccionado && saldoDisponible > 0 && (
              <div className="total-section">
                <div className="total-container">
                  <div className="total-info">
                    <div className="total-label-container">
                      <span className="total-label">ABONO A REALIZAR:</span>
                      <div className="total-calculation">
                        Saldo disponible: ${saldoDisponible.toFixed(2)}
                      </div>
                    </div>
                    <div className="total-amount-container">
                      <span className="total-amount">${montoAbono.toFixed(2)}</span>
                      <div className="pago-buttons-container">
                        <button 
                          type="button" 
                          onClick={handleAbonoCompleto}
                          className="btn-pago-completo"
                          title="Establecer el monto exacto del saldo"
                        >
                          Abono Exacto
                        </button>
                        {formData.metodo_pago === 'efectivo' && (
                          <div className="pago-con-vuelto-buttons">
                            <button 
                              type="button" 
                              onClick={() => handlePagoConVuelto(100)}
                              className="btn-pago-vuelto"
                              title="Abonar con $100"
                            >
                              Con $100
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handlePagoConVuelto(500)}
                              className="btn-pago-vuelto"
                              title="Abonar con $500"
                            >
                              Con $500
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {vuelto > 0 && (
                    <div className="vuelto-section">
                      <div className="vuelto-info">
                        <span className="vuelto-label">VUELTO:</span>
                        <span className="vuelto-amount">${vuelto.toFixed(2)}</span>
                      </div>
                      <div className="vuelto-detalle">
                        Se pagó ${montoTotal.toFixed(2)} - Abono ${montoAbono.toFixed(2)}
                      </div>
                    </div>
                  )}
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
            {formData.metodo_pago !== 'mixto' && creditoSeleccionado && saldoDisponible > 0 && (
              <div className="form-grupo">
                <label className="form-label">
                  Monto Recibido **
                  {formData.metodo_pago === 'efectivo' && <span className="hint-text"> (puede ser mayor al abono)</span>}
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
                    disabled={loading || saldoDisponible <= 0}
                  />
                </div>
                {saldoDisponible > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Máximo abono: ${saldoDisponible.toFixed(2)}
                  </p>
                )}
                {formData.metodo_pago === 'efectivo' && vuelto > 0 && (
                  <div className="vuelto-mini">
                    <span className="vuelto-mini-label">Vuelto a dar: </span>
                    <span className="vuelto-mini-amount">${vuelto.toFixed(2)}</span>
                  </div>
                )}
                {saldoDisponible <= 0 && (
                  <p className="text-sm text-red-500 mt-1">
                    Este crédito ya está pagado completamente
                  </p>
                )}
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
            {formData.metodo_pago === 'mixto' && creditoSeleccionado && saldoDisponible > 0 && (
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
                        max={saldoDisponible}
                        step="0.01"
                        value={efectivo}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0
                          setEfectivo(Math.max(0, value))
                          setError('')
                        }}
                        className="form-input-monto"
                        disabled={loading || saldoDisponible <= 0}
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
                        max={saldoDisponible}
                        step="0.01"
                        value={tarjeta}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0
                          setTarjeta(Math.max(0, value))
                          setError('')
                        }}
                        className="form-input-monto"
                        disabled={loading || saldoDisponible <= 0}
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
                        max={saldoDisponible}
                        step="0.01"
                        value={transferencia}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0
                          setTransferencia(Math.max(0, value))
                          setError('')
                        }}
                        className="form-input-monto"
                        disabled={loading || saldoDisponible <= 0}
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
                    <span className="resumen-mixto-label">Saldo disponible:</span>
                    <span className="resumen-mixto-valor">${saldoDisponible.toFixed(2)}</span>
                  </div>
                  <div className="resumen-mixto-item">
                    <span className="resumen-mixto-label">Total del abono:</span>
                    <span className="resumen-mixto-valor">${montoAbono.toFixed(2)}</span>
                  </div>
                  {vuelto > 0 && (
                    <div className="resumen-mixto-item resumen-vuelto">
                      <span className="resumen-mixto-label">Vuelto:</span>
                      <span className="resumen-mixto-valor">${vuelto.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="resumen-mixto-item">
                    <span className="resumen-mixto-label">Nuevo saldo:</span>
                    <span className={`resumen-mixto-valor ${saldoDisponible - montoAbono > 0 ? 'text-orange-500' : 'text-green-600'}`}>
                      ${(saldoDisponible - montoAbono).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Validación de pago */}
            {creditoSeleccionado && saldoDisponible > 0 && (
              <div className={`validacion-total ${montoTotal >= montoAbono ? 'validacion-ok' : 'validacion-error'}`}>
                {montoTotal === montoAbono ? (
                  <div className="validacion-mensaje validacion-ok">
                    <span className="validacion-icono">✓</span>
                    Pago exacto para abono de ${montoAbono.toFixed(2)}
                  </div>
                ) : montoTotal > montoAbono ? (
                  <div className="validacion-mensaje validacion-vuelto">
                    <span className="validacion-icono">🔄</span>
                    Pago completo. Vuelto: ${vuelto.toFixed(2)} (Abono: ${montoAbono.toFixed(2)})
                  </div>
                ) : (
                  <div className="validacion-mensaje validacion-error">
                    <span className="validacion-icono">⚠</span>
                    Pago insuficiente. Faltan: ${(montoAbono - montoTotal).toFixed(2)} para abonar ${montoAbono.toFixed(2)}
                  </div>
                )}
              </div>
            )}

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
                    <span className="resumen-label">Saldo actual:</span>
                    <span className="resumen-valor">${saldoDisponible.toFixed(2)}</span>
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
                      {metodosPago.find(m => m.value === formData.metodo_pago)?.label}
                    </span>
                  </div>
                  
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
                      <span className="resumen-label">Monto recibido:</span>
                      <span className="resumen-valor">
                        ${montoTotal.toFixed(2)}
                        {formData.metodo_pago === 'tarjeta' && banco && ` (${banco})`}
                        {formData.metodo_pago === 'transferencia' && banco && ` (${banco})`}
                      </span>
                    </div>
                  )}
                  
                  <div className="resumen-item resumen-total">
                    <span className="resumen-label">Abono a realizar:</span>
                    <span className="resumen-valor-total">
                      ${montoAbono.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="resumen-item">
                    <span className="resumen-label">Nuevo saldo:</span>
                    <span className={`resumen-valor ${saldoDisponible - montoAbono > 0 ? 'text-orange-500 font-semibold' : 'text-green-600 font-semibold'}`}>
                      ${(saldoDisponible - montoAbono).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      {saldoDisponible - montoAbono <= 0 && ' (¡Pagado!)'}
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
              disabled={loading || montoAbono <= 0 || montoTotal < montoAbono}
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