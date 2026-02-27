import React, { useState, useEffect } from 'react'
import { supabase } from '../../database/supabase'
import './ModalEditarCredito.css'

const ModalEditarCredito = ({ 
  isOpen, 
  onClose, 
  onCreditoEditado, 
  credito, 
  productos, 
  servicios = [],
  itemsDisponibles = []
}) => {
  const [formData, setFormData] = useState({
    item_id: '',
    tipo: 'producto',
    cantidad: 1,
    precio_unitario: 0,
    nombre_cliente: '',
    fecha_inicio: '',
    fecha_fin: ''
  })
  
  // Estado para búsqueda de items
  const [busquedaItem, setBusquedaItem] = useState('')
  const [itemsFiltrados, setItemsFiltrados] = useState([])
  const [mostrarResultados, setMostrarResultados] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [abonos, setAbonos] = useState([])
  const [totalAbonado, setTotalAbonado] = useState(0)

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

  useEffect(() => {
    if (credito && isOpen) {
      // Determinar el tipo de item
      const itemId = credito.producto_id || credito.servicio_id
      const tipo = credito.producto_id ? 'producto' : 'servicio'
      
      setFormData({
        item_id: itemId,
        tipo: tipo,
        cantidad: credito.cantidad || 1,
        precio_unitario: credito.precio_unitario || 0,
        nombre_cliente: credito.nombre_cliente || '',
        fecha_inicio: credito.fecha_inicio || '',
        fecha_fin: credito.fecha_fin || ''
      })
      
      // Buscar el item correspondiente
      const item = itemsCombinados.find(i => i.id === itemId)
      if (item) {
        setBusquedaItem(item.nombre)
      }
      
      // Cargar abonos de este crédito
      cargarAbonosCredito(credito.id)
    }
  }, [credito, isOpen, itemsCombinados])

  // Filtrar items por búsqueda
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
    
    setItemsFiltrados(filtrados.slice(0, 10))
    setMostrarResultados(true)
  }, [busquedaItem, itemsCombinados])

  // Cargar abonos del crédito
  const cargarAbonosCredito = async (creditoId) => {
    try {
      const { data, error } = await supabase
        .from('abonos_credito')
        .select('*')
        .eq('venta_credito_id', creditoId)
      
      if (error) throw error
      
      setAbonos(data || [])
      
      const total = (data || []).reduce((sum, abono) => sum + parseFloat(abono.monto), 0)
      setTotalAbonado(total)
    } catch (err) {
      console.error('Error cargando abonos:', err)
    }
  }

  // Seleccionar item
  const seleccionarItem = (item) => {
    setFormData({
      ...formData,
      item_id: item.id,
      tipo: item.tipo,
      precio_unitario: item.precio || item.precio_venta || 0
    })
    setBusquedaItem(item.nombre)
    setItemsFiltrados([])
    setMostrarResultados(false)
    setError('')
  }

  if (!isOpen || !credito) return null

  const calcularTotal = () => {
    const cantidad = parseInt(formData.cantidad) || 0
    const precio = parseFloat(formData.precio_unitario) || 0
    return cantidad * precio
  }

  const handleCantidadChange = (nuevaCantidad) => {
    if (nuevaCantidad >= 1) {
      setFormData({
        ...formData,
        cantidad: nuevaCantidad
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.item_id || formData.cantidad < 1 || !formData.nombre_cliente.trim() || !formData.fecha_fin) {
      setError('Por favor completa todos los campos obligatorios')
      return
    }

    setLoading(true)
    setError('')

    try {
      const totalNuevo = calcularTotal()
      const totalAnterior = parseFloat(credito.total) || 0
      
      const nuevoSaldoPendiente = totalNuevo - totalAbonado
      
      let nuevoEstado = 'activo'
      if (nuevoSaldoPendiente <= 0) {
        nuevoEstado = 'pagado'
      } else if (new Date(formData.fecha_fin) < new Date()) {
        nuevoEstado = 'vencido'
      }

      const creditoData = {
        ...(formData.tipo === 'producto' 
          ? { producto_id: formData.item_id, servicio_id: null }
          : { servicio_id: formData.item_id, producto_id: null }),
        cantidad: parseInt(formData.cantidad),
        precio_unitario: parseFloat(formData.precio_unitario),
        total: totalNuevo,
        nombre_cliente: formData.nombre_cliente.trim(),
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        saldo_pendiente: nuevoSaldoPendiente > 0 ? nuevoSaldoPendiente : 0,
        estado: nuevoEstado,
        tipo_item: formData.tipo
      }

      const { error: supabaseError } = await supabase
        .from('ventas_credito')
        .update(creditoData)
        .eq('id', credito.id)
      
      if (supabaseError) throw supabaseError

      // Actualizar facturados solo si es producto
      if (formData.tipo === 'producto' && Math.abs(totalNuevo - totalAnterior) > 0.01) {
        try {
          await supabase
            .from('facturados')
            .update({
              total: totalNuevo,
              cantidad: parseInt(formData.cantidad),
              precio_unitario: parseFloat(formData.precio_unitario)
            })
            .eq('producto_id', credito.producto_id)
            .eq('tipo_venta', 'credito')
            .gte('fecha', credito.fecha)
            .lte('fecha', new Date().toISOString())
        } catch (err) {
          console.log('Error actualizando facturados:', err)
        }
      }

      onCreditoEditado()
      onClose()
    } catch (err) {
      console.error('Error editando crédito:', err)
      setError('Error al actualizar el crédito. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const itemSeleccionado = itemsCombinados.find(p => p.id === formData.item_id)
  const totalAnterior = credito ? parseFloat(credito.total) : 0
  const totalNuevo = calcularTotal()
  const diferencia = totalNuevo - totalAnterior
  const nuevoSaldoPendiente = totalNuevo - totalAbonado

  return (
    <div className="modal-overlay">
      <div className="modal-container-editar-credito">
        <div className="modal-header-editar-credito">
          <div className="modal-titulo-contenedor">
            <svg className="modal-icono-editar" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <h3 className="modal-titulo-editar-credito">Editar Crédito</h3>
          </div>
          <button onClick={onClose} className="modal-cerrar-btn" disabled={loading}>
            &times;
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form-credito">
          <div className="modal-contenido-editar-credito">
            {error && (
              <div className="error-mensaje">
                <svg className="error-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            
            <div className="info-credito-actual">
              <div className="info-item-actual">
                <span className="info-label-actual">Cliente:</span>
                <span className="info-valor-actual">{credito.nombre_cliente}</span>
              </div>
              <div className="info-item-actual">
                <span className="info-label-actual">Item:</span>
                <span className="info-valor-actual">
                  {credito.item?.nombre || 'Producto/Servicio'}
                  {credito.tipo_item === 'servicio' && ' 💇'}
                </span>
              </div>
              <div className="info-item-actual">
                <span className="info-label-actual">Total anterior:</span>
                <span className="info-valor-actual">C${totalAnterior.toFixed(2)}</span>
              </div>
              <div className="info-item-actual">
                <span className="info-label-actual">Total abonado:</span>
                <span className="info-valor-actual">C${totalAbonado.toFixed(2)}</span>
              </div>
              <div className="info-item-actual">
                <span className="info-label-actual">Saldo pendiente:</span>
                <span className="info-valor-actual">C${nuevoSaldoPendiente.toFixed(2)}</span>
              </div>
              <div className="info-item-actual">
                <span className="info-label-actual">Estado actual:</span>
                <span className={`info-valor-actual ${credito.estado === 'pagado' ? 'text-green-600' : credito.estado === 'vencido' ? 'text-red-600' : 'text-orange-600'}`}>
                  {credito.estado?.toUpperCase() || 'ACTIVO'}
                </span>
              </div>
            </div>
            
            <div className="form-grupo">
              <label className="form-label">
                Nombre del Cliente *
              </label>
              <input
                type="text"
                value={formData.nombre_cliente}
                onChange={(e) => setFormData({...formData, nombre_cliente: e.target.value})}
                className="form-input"
                placeholder="Ej: María González"
                disabled={loading}
              />
            </div>
            
            {/* BUSCADOR DE PRODUCTOS/SERVICIOS */}
            <div className="form-grupo">
              <label className="form-label">
                Buscar Producto o Servicio *
              </label>
              <div className="busqueda-producto-container">
                <input
                  type="text"
                  value={busquedaItem}
                  onChange={(e) => setBusquedaItem(e.target.value)}
                  onFocus={() => busquedaItem.trim() && setMostrarResultados(true)}
                  className="form-input-busqueda"
                  placeholder="Buscar por nombre, categoría o código..."
                  disabled={loading}
                  autoComplete="off"
                />
                {busquedaItem && (
                  <button
                    type="button"
                    onClick={() => {
                      setBusquedaItem('')
                      setFormData({...formData, item_id: '', precio_unitario: 0})
                      setItemsFiltrados([])
                      setMostrarResultados(false)
                    }}
                    className="boton-limpiar-busqueda"
                  >
                    ×
                  </button>
                )}
                
                {/* RESULTADOS DE BÚSQUEDA */}
                {mostrarResultados && itemsFiltrados.length > 0 && (
                  <div className="resultados-busqueda">
                    {itemsFiltrados.map((item) => (
                      <div
                        key={item.id}
                        className="resultado-item"
                        onClick={() => seleccionarItem(item)}
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
                          <span className="resultado-precio">C${(item.precio || item.precio_venta || 0).toFixed(2)}</span>
                          {item.codigo_barras && (
                            <span className="resultado-codigo">📟 {item.codigo_barras}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {mostrarResultados && itemsFiltrados.length === 0 && busquedaItem.trim() !== '' && (
                  <div className="resultados-busqueda">
                    <div className="resultado-vacio">
                      No se encontraron items con "{busquedaItem}"
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Información del item seleccionado */}
            {itemSeleccionado && (
              <div className="producto-info-actualizado">
                <div className="producto-detalles-actualizado">
                  <div className="detalle-item-actualizado">
                    <span>Precio unitario:</span>
                    <strong>C${itemSeleccionado.precio?.toFixed(2) || '0.00'}</strong>
                  </div>
                  <div className="detalle-item-actualizado">
                    <span>Tipo:</span>
                    <strong>{itemSeleccionado.tipo === 'servicio' ? '💇 Servicio' : '📦 Producto'}</strong>
                  </div>
                  {itemSeleccionado.categoria && (
                    <div className="detalle-item-actualizado">
                      <span>Categoría:</span>
                      <strong>{itemSeleccionado.categoria}</strong>
                    </div>
                  )}
                  {itemSeleccionado.codigo_barras && (
                    <div className="detalle-item-actualizado">
                      <span>Código:</span>
                      <strong>{itemSeleccionado.codigo_barras}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="form-grupo">
              <label className="form-label">
                Cantidad *
              </label>
              <div className="input-group-cantidad">
                <button
                  type="button"
                  onClick={() => handleCantidadChange(formData.cantidad - 1)}
                  className="cantidad-btn"
                  disabled={loading || formData.cantidad <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={formData.cantidad}
                  onChange={(e) => handleCantidadChange(parseInt(e.target.value) || 1)}
                  className="form-input-cantidad"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => handleCantidadChange(formData.cantidad + 1)}
                  className="cantidad-btn"
                  disabled={loading}
                >
                  +
                </button>
              </div>
            </div>
            
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
                />
              </div>
            </div>
            
            <div className="resumen-credito-container">
              <h4 className="resumen-credito-titulo">Cambios en el Crédito</h4>
              <div className="resumen-detalles">
                <div className="resumen-item">
                  <span className="resumen-label">Total anterior:</span>
                  <span className="resumen-valor">C${totalAnterior.toFixed(2)}</span>
                </div>
                <div className="resumen-item">
                  <span className="resumen-label">Total nuevo:</span>
                  <span className="resumen-valor">C${totalNuevo.toFixed(2)}</span>
                </div>
                <div className="resumen-item resumen-diferencia">
                  <span className="resumen-label">Diferencia en total:</span>
                  <span className={`resumen-valor ${diferencia > 0 ? 'diferencia-positiva' : diferencia < 0 ? 'diferencia-negativa' : ''}`}>
                    C${diferencia.toFixed(2)}
                  </span>
                </div>
                <div className="resumen-item">
                  <span className="resumen-label">Total abonado:</span>
                  <span className="resumen-valor">C${totalAbonado.toFixed(2)}</span>
                </div>
                <div className="resumen-item">
                  <span className="resumen-label">Nuevo saldo pendiente:</span>
                  <span className={`resumen-valor ${nuevoSaldoPendiente > 0 ? 'diferencia-negativa' : 'diferencia-positiva'}`}>
                    C${nuevoSaldoPendiente > 0 ? nuevoSaldoPendiente.toFixed(2) : '0.00'}
                    {nuevoSaldoPendiente <= 0 && ' (¡Pagado!)'}
                  </span>
                </div>
                <div className="resumen-item resumen-total">
                  <span className="resumen-label">Total actualizado:</span>
                  <span className="resumen-valor-total">
                    C${totalNuevo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="resumen-item">
                  <span className="resumen-label">Nuevo estado:</span>
                  <span className={`resumen-valor ${nuevoSaldoPendiente <= 0 ? 'diferencia-positiva' : new Date(formData.fecha_fin) < new Date() ? 'diferencia-negativa' : ''}`}>
                    {nuevoSaldoPendiente <= 0 ? 'PAGADO' : new Date(formData.fecha_fin) < new Date() ? 'VENCIDO' : 'ACTIVO'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Advertencia si hay abonos registrados */}
            {abonos.length > 0 && (
              <div className="advertencia-abonos">
                <div className="advertencia-icono">⚠</div>
                <div className="advertencia-contenido">
                  <strong>Importante:</strong> Este crédito tiene {abonos.length} abono(s) registrado(s) por un total de ${totalAbonado.toFixed(2)}.
                  {diferencia > 0 && (
                    <div className="advertencia-detalle">
                      El saldo pendiente aumentará de C${(credito.saldo_pendiente || 0).toFixed(2)} a C${nuevoSaldoPendiente.toFixed(2)}.
                    </div>
                  )}
                  {diferencia < 0 && (
                    <div className="advertencia-detalle">
                      El saldo pendiente disminuirá de C${(credito.saldo_pendiente || 0).toFixed(2)} a C${nuevoSaldoPendiente > 0 ? nuevoSaldoPendiente.toFixed(2) : '0.00'}.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="modal-footer-editar-credito">
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
              disabled={loading}
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
                  Actualizar Crédito
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalEditarCredito