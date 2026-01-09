import React, { useState, useEffect } from 'react'
import './ModalEditarVenta.css'

const ModalEditarVenta = ({
  isOpen,
  onClose,
  onSave,
  venta,
  productos
}) => {
  const [formData, setFormData] = useState({
    producto_id: '',
    cantidad: 1,
    precio_unitario: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Cargar datos de la venta al abrir el modal
  useEffect(() => {
    if (venta) {
      setFormData({
        producto_id: venta.producto_id || '',
        cantidad: venta.cantidad || 1,
        precio_unitario: venta.precio_unitario || 0
      })
      setError('')
    }
  }, [venta])

  if (!isOpen || !venta) return null

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

    setLoading(true)
    try {
      // Calcular total
      const total = formData.cantidad * formData.precio_unitario
      
      const datosActualizados = {
        producto_id: formData.producto_id,
        cantidad: parseInt(formData.cantidad),
        precio_unitario: parseFloat(formData.precio_unitario),
        total: total
      }
      
      await onSave(datosActualizados)
    } catch (error) {
      setError('Error al actualizar la venta: ' + error.message)
      console.error('Error al actualizar:', error)
    } finally {
      setLoading(false)
    }
  }

  const productoSeleccionado = productos.find(p => p.id === formData.producto_id)
  const productoOriginal = venta.productos || {}

  // Calcular total
  const total = formData.cantidad * formData.precio_unitario

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
            {/* Información de la venta original */}
            <div className="venta-original-info">
              <h4 className="resumen-venta-titulo">VENTA ORIGINAL:</h4>
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
                    <strong>{venta.cantidad} unidades</strong>
                  </span>
                </div>
                <div className="resumen-item">
                  <span className="resumen-label">Precio unitario:</span>
                  <span className="resumen-valor">
                    <strong>${venta.precio_unitario?.toFixed(2) || '0.00'}</strong>
                  </span>
                </div>
                <div className="resumen-item resumen-total">
                  <span className="resumen-label">Total:</span>
                  <span className="resumen-valor-total">
                    ${venta.total?.toFixed(2) || '0.00'}
                  </span>
                </div>
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
                    {producto.nombre} - ${producto.precio?.toFixed(2)}
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
                    <span className="resumen-valor">${formData.precio_unitario.toFixed(2)}</span>
                  </div>
                  <div className="resumen-item">
                    <span className="resumen-label">Cantidad:</span>
                    <span className="resumen-valor">{formData.cantidad} unidades</span>
                  </div>
                  <div className="resumen-item resumen-total">
                    <span className="resumen-label">Nuevo total:</span>
                    <span className="resumen-valor-total">${total.toFixed(2)}</span>
                  </div>
                  <div className="resumen-item diferencia-item">
                    <span className="resumen-label">Diferencia:</span>
                    <span className={`diferencia-valor ${total > venta.total ? 'diferencia-positiva' : 'diferencia-negativa'}`}>
                      ${(total - venta.total).toFixed(2)}
                    </span>
                  </div>
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
              disabled={loading || !formData.producto_id}
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