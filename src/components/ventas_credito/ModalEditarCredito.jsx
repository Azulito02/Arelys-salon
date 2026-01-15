import React, { useState, useEffect } from 'react'
import { supabase } from '../../database/supabase'
import './ModalEditarCredito.css'

const ModalEditarCredito = ({ isOpen, onClose, onCreditoEditado, credito, productos }) => {
  const [formData, setFormData] = useState({
    producto_id: '',
    cantidad: 1,
    precio_unitario: '',
    nombre_cliente: '',
    fecha_inicio: '',
    fecha_fin: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (credito && isOpen) {
      setFormData({
        producto_id: credito.producto_id,
        cantidad: credito.cantidad,
        precio_unitario: credito.precio_unitario,
        nombre_cliente: credito.nombre_cliente,
        fecha_inicio: credito.fecha_inicio,
        fecha_fin: credito.fecha_fin
      })
    }
  }, [credito, isOpen])

  if (!isOpen || !credito) return null

  const calcularTotal = () => {
    const cantidad = parseInt(formData.cantidad) || 0
    const precio = parseFloat(formData.precio_unitario) || 0
    return cantidad * precio
  }

  const handleProductoChange = (productoId) => {
    const producto = productos.find(p => p.id === productoId)
    if (producto) {
      setFormData({
        ...formData,
        producto_id: productoId,
        precio_unitario: producto.precio
      })
    } else {
      setFormData({
        ...formData,
        producto_id: productoId,
        precio_unitario: ''
      })
    }
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
    
    if (!formData.producto_id || formData.cantidad < 1 || !formData.nombre_cliente.trim() || !formData.fecha_fin) {
      setError('Por favor completa todos los campos obligatorios')
      return
    }

    setLoading(true)
    setError('')

    try {
      const total = calcularTotal()
      
      // CORREGIDO: Removí fecha_edicion ya que no existe en la tabla
      const creditoData = {
        producto_id: formData.producto_id,
        cantidad: parseInt(formData.cantidad),
        precio_unitario: parseFloat(formData.precio_unitario),
        total: total,
        nombre_cliente: formData.nombre_cliente.trim(),
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin
        // fecha_edicion: new Date().toISOString() // <-- Esta línea causaba el error
      }

      const { error: supabaseError } = await supabase
        .from('ventas_credito')
        .update(creditoData)
        .eq('id', credito.id)
      
      if (supabaseError) throw supabaseError
      
      onCreditoEditado()
    } catch (err) {
      console.error('Error editando crédito:', err)
      setError('Error al actualizar el crédito. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const productoSeleccionado = productos.find(p => p.id === formData.producto_id)
  const totalAnterior = credito ? parseFloat(credito.total) : 0
  const totalNuevo = calcularTotal()

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
                <span className="info-label-actual">Total anterior:</span>
                <span className="info-valor-actual">${totalAnterior.toFixed(2)}</span>
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
            
            <div className="form-grupo">
              <label className="form-label">
                Producto *
              </label>
              <select
                value={formData.producto_id}
                onChange={(e) => handleProductoChange(e.target.value)}
                className="form-select"
                disabled={loading}
              >
                <option value="">Selecciona un producto</option>
                {productos.map((producto) => (
                  <option key={producto.id} value={producto.id}>
                    {producto.nombre} - ${producto.precio}
                  </option>
                ))}
              </select>
            </div>
            
            {productoSeleccionado && (
              <div className="producto-info-actualizado">
                <div className="producto-detalles-actualizado">
                  <div className="detalle-item-actualizado">
                    <span>Precio unitario:</span>
                    <strong>${productoSeleccionado.precio}</strong>
                  </div>
                  <div className="detalle-item-actualizado">
                    <span>Categoría:</span>
                    <strong>{productoSeleccionado.categoria || 'Sin categoría'}</strong>
                  </div>
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
                  <span className="resumen-valor">${totalAnterior.toFixed(2)}</span>
                </div>
                <div className="resumen-item">
                  <span className="resumen-label">Total nuevo:</span>
                  <span className="resumen-valor">${totalNuevo.toFixed(2)}</span>
                </div>
                <div className="resumen-item resumen-diferencia">
                  <span className="resumen-label">Diferencia:</span>
                  <span className={`resumen-valor ${totalNuevo > totalAnterior ? 'diferencia-positiva' : totalNuevo < totalAnterior ? 'diferencia-negativa' : ''}`}>
                    ${(totalNuevo - totalAnterior).toFixed(2)}
                  </span>
                </div>
                <div className="resumen-item resumen-total">
                  <span className="resumen-label">Total actualizado:</span>
                  <span className="resumen-valor-total">
                    ${totalNuevo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
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