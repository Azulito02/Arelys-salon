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

  // Resetear datos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setError('')
    }
  }, [isOpen])

  if (!isOpen) return null

  // Obtener producto seleccionado
  const productoSeleccionado = productos.find(p => p.id === ventaData.producto_id)

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

  setLoading(true)
  try {
    // Calcular total
    const total = ventaData.cantidad * ventaData.precio_unitario
    
    const datosCompletos = {
      producto_id: ventaData.producto_id,
      cantidad: parseInt(ventaData.cantidad),
      precio_unitario: parseFloat(ventaData.precio_unitario),
      total: total,
      fecha: new Date().toISOString()
      // REMOVED: producto_nombre: productoSeleccionado?.nombre || ''
    }
    
    console.log('Guardando venta:', datosCompletos)
    await onSave(datosCompletos)
    
    // Resetear formulario después de guardar
    setVentaData({
      producto_id: '',
      cantidad: 1,
      precio_unitario: 0
    })
  } catch (error) {
    setError('Error al registrar la venta: ' + error.message)
    console.error('Error al registrar:', error)
  } finally {
    setLoading(false)
  }
}

  // Calcular total
  const total = ventaData.cantidad * ventaData.precio_unitario

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
            
            <div className="form-grupo">
              <label className="form-label">
                Precio Unitario **
              </label>
              <div className="input-group-precio">
                <span className="precio-simbolo">$</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={ventaData.precio_unitario}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0
                    setVentaData({...ventaData, precio_unitario: Math.max(0.01, value)})
                    setError('')
                  }}
                  className="form-input-precio"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Separador visual */}
            <div className="separador-modal"></div>

            {/* Resumen de Venta - como en la imagen */}
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
                  <div className="resumen-item resumen-total">
                    <span className="resumen-label">Total:</span>
                    <span className="resumen-valor-total">${total.toFixed(2)}</span>
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
              disabled={loading || !ventaData.producto_id}
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