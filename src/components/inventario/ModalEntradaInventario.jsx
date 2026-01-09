import React, { useState } from 'react'
import './ModalEntradaInventario.css'

const ModalEntradaInventario = ({
  isOpen,
  onClose,
  onSave,
  productos,
  entradaData,
  setEntradaData
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validaciones
    if (!entradaData.producto_id) {
      setError('Debes seleccionar un producto')
      return
    }

    const cantidad = parseInt(entradaData.entrada)
    if (isNaN(cantidad) || cantidad < 1) {
      setError('La cantidad debe ser un número mayor a 0')
      return
    }

    setLoading(true)
    try {
      const entradaCompleta = {
        producto_id: entradaData.producto_id,
        entrada: cantidad
      }
      
      await onSave(entradaCompleta)
    } catch (error) {
      setError('Error al guardar la entrada. Intenta nuevamente.')
      console.error('Error en modal:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCantidadChange = (e) => {
    const value = e.target.value
    // Permite solo números y vacío temporalmente
    if (value === '' || /^[0-9\b]+$/.test(value)) {
      setEntradaData({
        ...entradaData, 
        entrada: value === '' ? '' : parseInt(value)
      })
    }
  }

  const incrementarCantidad = () => {
    const current = parseInt(entradaData.entrada) || 0
    setEntradaData({
      ...entradaData,
      entrada: current + 1
    })
  }

  const decrementarCantidad = () => {
    const current = parseInt(entradaData.entrada) || 1
    if (current > 1) {
      setEntradaData({
        ...entradaData,
        entrada: current - 1
      })
    }
  }

  const productoSeleccionado = productos.find(
    p => p.id === entradaData.producto_id
  )

  return (
    <div className="modal-overlay">
      <div className="modal-container-inventario">
        <div className="modal-header-inventario">
          <h3 className="modal-titulo-inventario">
            Nueva Entrada al Inventario
          </h3>
          <button
            onClick={onClose}
            className="modal-cerrar-btn"
            disabled={loading}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form-inventario">
          <div className="modal-contenido-inventario">
            {/* Mensaje de error */}
            {error && (
              <div className="error-mensaje-modal">
                <svg className="error-icono-modal" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <div className="form-grupo">
              <label className="form-label">
                Producto *
              </label>
              <select
                value={entradaData.producto_id}
                onChange={(e) => {
                  setEntradaData({
                    ...entradaData, 
                    producto_id: e.target.value
                  })
                  setError('')
                }}
                className="form-select"
                required
                disabled={loading}
              >
                <option value="">Selecciona un producto</option>
                {productos.map((producto) => (
                  <option key={producto.id} value={producto.id}>
                    {producto.nombre} - ${producto.precio?.toFixed(2)}
                    {producto.codigo && ` (${producto.codigo})`}
                  </option>
                ))}
              </select>
              <p className="form-ayuda">
                Selecciona el producto que ingresará al inventario
              </p>
            </div>
            
            <div className="form-grupo">
              <label className="form-label">
                Cantidad *
              </label>
              <div className="input-group-cantidad">
                <button
                  type="button"
                  onClick={decrementarCantidad}
                  className="cantidad-btn"
                  disabled={loading}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={entradaData.entrada}
                  onChange={handleCantidadChange}
                  className="form-input-cantidad"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={incrementarCantidad}
                  className="cantidad-btn"
                  disabled={loading}
                >
                  +
                </button>
              </div>
              <p className="form-ayuda">
                Ingresa la cantidad de unidades que se agregarán
              </p>
            </div>

            {/* Información del producto seleccionado */}
            {entradaData.producto_id && productoSeleccionado && (
              <div className="producto-info">
                <h4 className="producto-info-titulo">Resumen de la entrada:</h4>
                <div className="producto-detalles">
                  <div className="detalle-item">
                    <span>Producto:</span>
                    <strong>{productoSeleccionado.nombre}</strong>
                  </div>
                  <div className="detalle-item">
                    <span>Precio unitario:</span>
                    <strong>${productoSeleccionado.precio?.toFixed(2)}</strong>
                  </div>
                  <div className="detalle-item">
                    <span>Cantidad:</span>
                    <strong>{entradaData.entrada} unidades</strong>
                  </div>
                  <div className="detalle-item total">
                    <span>Valor total:</span>
                    <strong className="valor-total">
                      ${(productoSeleccionado.precio * (parseInt(entradaData.entrada) || 0)).toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="modal-footer-inventario">
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
              className="btn-primario-inventario"
              disabled={loading || !entradaData.producto_id || !entradaData.entrada}
            >
              {loading ? (
                <>
                  <div className="spinner-pequeno-modal"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M5 13l4 4L19 7" />
                  </svg>
                  Registrar Entrada
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalEntradaInventario