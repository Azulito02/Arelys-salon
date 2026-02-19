import React, { useState, useEffect } from 'react'
import { supabase } from '../../database/supabase'
import './ModalAgregarAbono.css'

const ModalAgregarAbono = ({ isOpen, onClose, onAbonoAgregado, creditos }) => {
  const [formData, setFormData] = useState({
    cliente_nombre: '',
    metodo_pago: 'efectivo'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [vuelto, setVuelto] = useState(0)
  
  // Lista de clientes con saldo pendiente
  const [clientesConSaldo, setClientesConSaldo] = useState([])

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

  // Agrupar créditos por cliente al cargar
  useEffect(() => {
    if (creditos && creditos.length > 0) {
      const clientesMap = {}
      
      creditos.forEach(credito => {
        const clienteNombre = credito.nombre_cliente
        const saldo = credito.saldo_pendiente !== undefined 
          ? credito.saldo_pendiente 
          : credito.total || 0
        
        if (saldo <= 0) return // Solo clientes con saldo pendiente
        
        if (!clientesMap[clienteNombre]) {
          clientesMap[clienteNombre] = {
            nombre: clienteNombre,
            saldoTotal: 0,
            creditos: [],
            totalCreditos: 0,
            productos: new Set()
          }
        }
        
        clientesMap[clienteNombre].creditos.push(credito)
        clientesMap[clienteNombre].saldoTotal += saldo
        clientesMap[clienteNombre].totalCreditos += parseFloat(credito.total || 0)
        clientesMap[clienteNombre].productos.add(credito.productos?.nombre || 'Producto')
      })
      
      // Ordenar clientes alfabéticamente
      const clientesArray = Object.values(clientesMap)
      clientesArray.sort((a, b) => a.nombre.localeCompare(b.nombre))
      setClientesConSaldo(clientesArray)
    }
  }, [creditos])

  // Resetear datos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setFormData({
        cliente_nombre: '',
        metodo_pago: 'efectivo'
      })
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

  // Calcular monto total automáticamente
  const montoTotal = efectivo + tarjeta + transferencia

  // Calcular vuelto automáticamente
  useEffect(() => {
    if (formData.cliente_nombre) {
      const clienteSeleccionado = clientesConSaldo.find(c => c.nombre === formData.cliente_nombre)
      if (clienteSeleccionado) {
        const saldoDisponible = clienteSeleccionado.saldoTotal || 0
        const montoAbono = Math.min(montoTotal, saldoDisponible)
        const vueltoCalculado = montoTotal > montoAbono ? montoTotal - montoAbono : 0
        setVuelto(vueltoCalculado)
      }
    }
  }, [montoTotal, formData.cliente_nombre, clientesConSaldo])

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

  const clienteSeleccionado = clientesConSaldo.find(c => c.nombre === formData.cliente_nombre)
  const saldoDisponible = clienteSeleccionado?.saldoTotal || 0
  const montoAbono = Math.min(montoTotal, saldoDisponible)

  // Métodos de pago
  const metodosPago = [
    { value: 'efectivo', label: 'Efectivo', icon: '💰' },
    { value: 'tarjeta', label: 'Tarjeta', icon: '💳' },
    { value: 'transferencia', label: 'Transferencia', icon: '🏦' },
    { value: 'mixto', label: 'Mixto', icon: '🔄' }
  ]

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

  // Función para Pago Excedente
  const handlePagoConVuelto = (montoRedondo) => {
    if (formData.metodo_pago === 'efectivo') {
      const montoAPagar = Math.ceil(saldoDisponible / montoRedondo) * montoRedondo
      setEfectivo(montoAPagar)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.cliente_nombre || montoAbono <= 0) {
      setError('Por favor selecciona un cliente y ingresa un monto válido')
      return
    }

    if (montoTotal < montoAbono) {
      setError(`El pago ($${montoTotal.toFixed(2)}) es menor al monto del abono ($${montoAbono.toFixed(2)})`)
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

    setLoading(true)
    setError('')

    try {
      // OBTENER TODOS LOS CRÉDITOS DEL CLIENTE CON SALDO PENDIENTE
      const creditosDelCliente = creditos.filter(c => 
        c.nombre_cliente === formData.cliente_nombre && 
        c.saldo_pendiente > 0
      )

      if (creditosDelCliente.length === 0) {
        throw new Error('No hay créditos pendientes para este cliente')
      }

      // ORDENAR CRÉDITOS (los más antiguos primero)
      creditosDelCliente.sort((a, b) => new Date(a.fecha) - new Date(b.fecha))

      let saldoRestante = montoAbono
      const abonosCreados = []

      // DISTRIBUIR EL ABONO ENTRE TODOS LOS CRÉDITOS DEL CLIENTE
      for (const credito of creditosDelCliente) {
        if (saldoRestante <= 0) break

        const saldoCredito = credito.saldo_pendiente
        const montoParaEsteCredito = Math.min(saldoCredito, saldoRestante)

        if (montoParaEsteCredito > 0) {
          // Crear abono para este crédito
          const abonoData = {
            venta_credito_id: credito.id,
            monto: montoParaEsteCredito,
            metodo_pago: formData.metodo_pago,
            efectivo: formData.metodo_pago === 'efectivo' || formData.metodo_pago === 'mixto' ? montoParaEsteCredito : 0,
            tarjeta: formData.metodo_pago === 'tarjeta' ? montoParaEsteCredito : 0,
            transferencia: formData.metodo_pago === 'transferencia' ? montoParaEsteCredito : 0,
            vuelto: 0
          }

          // Agregar banco según el método de pago
          if (formData.metodo_pago === 'tarjeta' || formData.metodo_pago === 'transferencia') {
            abonoData.banco = banco
          } else if (formData.metodo_pago === 'mixto') {
            const bancosMixto = {
              tarjeta: bancoTarjeta || null,
              transferencia: bancoTransferencia || null
            }
            abonoData.banco = JSON.stringify(bancosMixto)
          }

          abonosCreados.push(abonoData)
          saldoRestante -= montoParaEsteCredito
        }
      }

      console.log('📝 Abonos a crear:', abonosCreados)

      // INSERTAR TODOS LOS ABONOS
      const { error: supabaseError } = await supabase
        .from('abonos_credito')
        .insert(abonosCreados)
      
      if (supabaseError) throw supabaseError

      // ACTUALIZAR SALDOS DE CADA CRÉDITO
      for (const abono of abonosCreados) {
        const credito = creditosDelCliente.find(c => c.id === abono.venta_credito_id)
        const nuevoSaldo = credito.saldo_pendiente - abono.monto
        
        await supabase
          .from('ventas_credito')
          .update({ saldo_pendiente: Math.max(0, nuevoSaldo) })
          .eq('id', abono.venta_credito_id)
      }

      // Reset form
      setFormData({
        cliente_nombre: '',
        metodo_pago: 'efectivo'
      })
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
      setError(err.message || 'Error al registrar el abono. Por favor intenta de nuevo.')
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
            
            {/* ✅ SELECT DE CLIENTES - SIN BUSCADOR */}
            <div className="form-grupo">
              <label className="form-label">
                Seleccionar Cliente *
              </label>
              <select
                value={formData.cliente_nombre}
                onChange={(e) => {
                  setFormData({...formData, cliente_nombre: e.target.value})
                  setError('')
                }}
                className="form-select"
                disabled={loading}
              >
                <option value="">-- Selecciona un cliente --</option>
                {clientesConSaldo.map((cliente) => (
                  <option key={cliente.nombre} value={cliente.nombre}>
                    {cliente.nombre} - Saldo: C${cliente.saldoTotal.toFixed(2)} ({cliente.creditos.length} crédito{cliente.creditos.length !== 1 ? 's' : ''})
                  </option>
                ))}
              </select>
              {clientesConSaldo.length === 0 && (
                <p className="text-sm text-red-500 mt-1">
                  No hay clientes con saldo pendiente
                </p>
              )}
            </div>
            
            {/* Información del cliente seleccionado */}
            {clienteSeleccionado && (
              <div className="credito-info-actualizado">
                <div className="credito-detalles-actualizado">
                  <div className="detalle-item-actualizado">
                    <span>Cliente:</span>
                    <strong>{clienteSeleccionado.nombre}</strong>
                  </div>
                  <div className="detalle-item-actualizado">
                    <span>Créditos activos:</span>
                    <strong>{clienteSeleccionado.creditos.length}</strong>
                  </div>
                  <div className="detalle-item-actualizado">
                    <span>Productos:</span>
                    <strong>{Array.from(clienteSeleccionado.productos).slice(0, 3).join(', ')}</strong>
                  </div>
                  <div className="detalle-item-actualizado">
                    <span>Total créditos:</span>
                    <strong>C${clienteSeleccionado.totalCreditos.toFixed(2)}</strong>
                  </div>
                  <div className="detalle-item-actualizado">
                    <span>Saldo total pendiente:</span>
                    <strong className="text-green-600">
                      C${clienteSeleccionado.saldoTotal.toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN DE ABONO */}
            {clienteSeleccionado && saldoDisponible > 0 && (
              <div className="total-section">
                <div className="total-container">
                  <div className="total-info">
                    <div className="total-label-container">
                      <span className="total-label">ABONO A REALIZAR:</span>
                      <div className="total-calculation">
                        Saldo total pendiente: C${saldoDisponible.toFixed(2)}
                      </div>
                    </div>
                    <div className="total-amount-container">
                      <span className="total-amount">C${montoAbono.toFixed(2)}</span>
                      <div className="pago-buttons-container">
                        <button 
                          type="button" 
                          onClick={handleAbonoCompleto}
                          className="btn-pago-completo"
                          title="Pagar el saldo total pendiente"
                        >
                          Pagar Todo
                        </button>
                        {formData.metodo_pago === 'efectivo' && (
                          <div className="pago-con-vuelto-buttons">
                            <button 
                              type="button" 
                              onClick={() => handlePagoConVuelto(100)}
                              className="btn-pago-vuelto"
                            >
                              Con C$100
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handlePagoConVuelto(500)}
                              className="btn-pago-vuelto"
                            >
                              Con C$500
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
                        <span className="vuelto-amount">C${vuelto.toFixed(2)}</span>
                      </div>
                      <div className="vuelto-detalle">
                        Se pagó C${montoTotal.toFixed(2)} - Abono C${montoAbono.toFixed(2)}
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

            {/* Para métodos simples */}
            {formData.metodo_pago !== 'mixto' && clienteSeleccionado && saldoDisponible > 0 && (
              <div className="form-grupo">
                <label className="form-label">
                  Monto a Pagar **
                  {formData.metodo_pago === 'efectivo' && <span className="hint-text"> (puede ser mayor al saldo)</span>}
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
                    disabled={loading || saldoDisponible <= 0}
                  />
                </div>
              </div>
            )}

            {/* Banco para tarjeta o transferencia */}
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
            {formData.metodo_pago === 'mixto' && clienteSeleccionado && saldoDisponible > 0 && (
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
                        max={saldoDisponible}
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
                        max={saldoDisponible}
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
                        max={saldoDisponible}
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
                    <span className="resumen-mixto-label">Saldo disponible:</span>
                    <span className="resumen-mixto-valor">C${saldoDisponible.toFixed(2)}</span>
                  </div>
                  <div className="resumen-mixto-item">
                    <span className="resumen-mixto-label">Total del abono:</span>
                    <span className="resumen-mixto-valor">C${montoAbono.toFixed(2)}</span>
                  </div>
                  {vuelto > 0 && (
                    <div className="resumen-mixto-item resumen-vuelto">
                      <span className="resumen-mixto-label">Vuelto:</span>
                      <span className="resumen-mixto-valor">C${vuelto.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Validación de pago */}
            {clienteSeleccionado && saldoDisponible > 0 && (
              <div className={`validacion-total ${montoTotal >= montoAbono ? 'validacion-ok' : 'validacion-error'}`}>
                {montoTotal === montoAbono ? (
                  <div className="validacion-mensaje validacion-ok">
                    <span className="validacion-icono">✓</span>
                    Pago exacto para abono de C${montoAbono.toFixed(2)}
                  </div>
                ) : montoTotal > montoAbono ? (
                  <div className="validacion-mensaje validacion-vuelto">
                    <span className="validacion-icono">🔄</span>
                    Pago completo. Vuelto: C${vuelto.toFixed(2)} (Abono: C${montoAbono.toFixed(2)})
                  </div>
                ) : (
                  <div className="validacion-mensaje validacion-error">
                    <span className="validacion-icono">⚠</span>
                    Pago insuficiente. Faltan: C${(montoAbono - montoTotal).toFixed(2)}
                  </div>
                )}
              </div>
            )}

            <div className="separador-modal"></div>

            {/* Resumen del Abono */}
            <div className="resumen-abono-container">
              <h4 className="resumen-abono-titulo">Resumen del Abono</h4>
              
              {clienteSeleccionado ? (
                <div className="resumen-detalles">
                  <div className="resumen-item">
                    <span className="resumen-label">Cliente:</span>
                    <span className="resumen-valor">{clienteSeleccionado.nombre}</span>
                  </div>
                  <div className="resumen-item">
                    <span className="resumen-label">Créditos a abonar:</span>
                    <span className="resumen-valor">{clienteSeleccionado.creditos.length}</span>
                  </div>
                  <div className="resumen-item">
                    <span className="resumen-label">Saldo total actual:</span>
                    <span className="resumen-valor">C${saldoDisponible.toFixed(2)}</span>
                  </div>
                  
                  {vuelto > 0 && (
                    <div className="resumen-item resumen-vuelto">
                      <span className="resumen-label">Vuelto:</span>
                      <span className="resumen-valor">C${vuelto.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="resumen-item">
                    <span className="resumen-label">Método de pago:</span>
                    <span className="resumen-valor">
                      {metodosPago.find(m => m.value === formData.metodo_pago)?.label}
                    </span>
                  </div>
                  
                  <div className="resumen-item resumen-total">
                    <span className="resumen-label">Abono a realizar:</span>
                    <span className="resumen-valor-total">
                      ${montoAbono.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="resumen-item">
                    <span className="resumen-label">Nuevo saldo total:</span>
                    <span className={`resumen-valor ${saldoDisponible - montoAbono > 0 ? 'text-orange-500' : 'text-green-600'}`}>
                      ${(saldoDisponible - montoAbono).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      {saldoDisponible - montoAbono <= 0 && ' (¡Pagado!)'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="resumen-vacio">
                  <p className="texto-resumen-vacio">Selecciona un cliente para ver el resumen</p>
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
              disabled={loading || !clienteSeleccionado || montoAbono <= 0 || montoTotal < montoAbono}
            >
              {loading ? (
                <>
                  <div className="spinner-pequeno"></div>
                  Procesando abono...
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