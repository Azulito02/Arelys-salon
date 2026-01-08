import { useState, useEffect } from 'react'
import './ModalEditarProducto.css'

const ModalEditarProducto = ({ isOpen, onClose, onSave, producto }) => {
  const [productoEditado, setProductoEditado] = useState({
    nombre: '',
    descripcion: '',
    precio: ''
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (producto) {
      setProductoEditado({
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        precio: producto.precio || ''
      })
      setError('')
    }
  }, [producto])

  if (!isOpen || !producto) return null

  const handleSubmit = () => {
    // Validaciones
    if (!productoEditado.nombre.trim()) {
      setError('El nombre del producto es obligatorio')
      return
    }
    
    if (!productoEditado.precio || parseFloat(productoEditado.precio) <= 0) {
      setError('El precio debe ser mayor a 0')
      return
    }
    
    // Preparar datos para guardar
    const productoData = {
      nombre: productoEditado.nombre.trim(),
      descripcion: productoEditado.descripcion.trim() || null,
      precio: parseFloat(productoEditado.precio)
    }
    
    onSave(productoData)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-contenedor">
        <div className="modal-header">
          <h3 className="modal-titulo">Editar Producto</h3>
          <button onClick={onClose} className="modal-cerrar">
            ×
          </button>
        </div>
        
        <div className="modal-body">
          {error && (
            <div className="error-mensaje">
              {error}
            </div>
          )}
          
          <div className="info-producto">
            <span className="info-label">ID:</span>
            <span className="info-valor">{producto.id.substring(0, 8)}...</span>
          </div>
          
          <div className="form-grupo">
            <label className="form-label">
              Nombre del Producto *
            </label>
            <input
              type="text"
              value={productoEditado.nombre}
              onChange={(e) => setProductoEditado({...productoEditado, nombre: e.target.value})}
              className="form-input"
              placeholder="Nombre del producto"
              autoFocus
            />
          </div>
          
          <div className="form-grupo">
            <label className="form-label">
              Descripción
            </label>
            <textarea
              value={productoEditado.descripcion}
              onChange={(e) => setProductoEditado({...productoEditado, descripcion: e.target.value})}
              className="form-textarea"
              rows="3"
              placeholder="Descripción del producto..."
            />
          </div>
          
          <div className="form-grupo">
            <label className="form-label">
              Precio ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={productoEditado.precio}
              onChange={(e) => setProductoEditado({...productoEditado, precio: e.target.value})}
              className="form-input"
              placeholder="0.00"
            />
          </div>
        </div>
        
        <div className="modal-footer">
          <button
            onClick={onClose}
            className="boton-secundario"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="boton-principal"
          >
            <span className="boton-icono">💾</span>
            Actualizar Producto
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalEditarProducto