import React, { useState } from 'react'
import { supabase } from '../../database/supabase'
import './ModalAgregarCredito.css'

const ModalAgregarCredito = ({ isOpen, onClose, onCreditoAgregado, productos }) => {
  const [formData, setFormData] = useState({
    producto_id: '',
    cantidad: 1,
    precio_unitario: '',
    nombre_cliente: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

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
      
      const creditoData = {
        producto_id: formData.producto_id,
        cantidad: parseInt(formData.cantidad),
        precio_unitario: parseFloat(formData.precio_unitario),
        total: total,
        nombre_cliente: formData.nombre_cliente.trim(),
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin
      }

      const { error: supabaseError } = await supabase
        .from('ventas_credito')
        .insert([creditoData])
      
      if (supabaseError) throw supabaseError
      
      // Reset form
      setFormData({
        producto_id: '',
        cantidad: 1,
        precio_unitario: '',
        nombre_cliente: '',
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      })
      
      onCreditoAgregado()
    } catch (err) {
      console.error('Error agregando crédito:', err)
      setError('Error al registrar el crédito. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const productoSeleccionado = productos.find(p => p.id === formData.producto_id)

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
            
            {/* Información del producto seleccionado */}
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
                  {productoSeleccionado.codigo && (
                    <div className="detalle-item-actualizado">
                      <span>Código:</span>
                      <strong>{productoSeleccionado.codigo}</strong>
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
            
            {/* Resumen del crédito */}
            <div className="resumen-credito-container">
              <h4 className="resumen-credito-titulo">Resumen del Crédito</h4>
              <div className="resumen-detalles">
                <div className="resumen-item">
                  <span className="resumen-label">Producto:</span>
                  <span className="resumen-valor">
                    {productoSeleccionado?.nombre || 'No seleccionado'}
                  </span>
                </div>
                <div className="resumen-item">
                  <span className="resumen-label">Cantidad:</span>
                  <span className="resumen-valor">{formData.cantidad} unidades</span>
                </div>
                <div className="resumen-item">
                  <span className="resumen-label">Precio unitario:</span>
                  <span className="resumen-valor">
                    ${parseFloat(formData.precio_unitario || 0).toFixed(2)}
                  </span>
                </div>
                <div className="resumen-item">
                  <span className="resumen-label">Periodo:</span>
                  <span className="resumen-valor">
                    {formData.fecha_inicio} al {formData.fecha_fin}
                  </span>
                </div>
                <div className="resumen-item resumen-total">
                  <span className="resumen-label">Total a Crédito:</span>
                  <span className="resumen-valor-total">
                    ${calcularTotal().toLocaleString('es-MX', { minimumFractionDigits: 2 })}
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
              disabled={loading}
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