import { useState } from 'react'
import './ModalAgregarProducto.css'

const ModalAgregarProducto = ({ isOpen, onClose, onSave }) => {
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    descripcion: '',
    precio: ''
  })
  const [error, setError] = useState('')

  const resetForm = () => {
    setNuevoProducto({
      nombre: '',
      descripcion: '',
      precio: ''
    })
    setError('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = () => {
    // Validaciones
    if (!nuevoProducto.nombre.trim()) {
      setError('El nombre del producto es obligatorio')
      return
    }
    
    if (!nuevoProducto.precio || parseFloat(nuevoProducto.precio) <= 0) {
      setError('El precio debe ser mayor a 0')
      return
    }
    
    // Preparar datos para guardar
    const productoData = {
      nombre: nuevoProducto.nombre.trim(),
      descripcion: nuevoProducto.descripcion.trim() || null,
      precio: parseFloat(nuevoProducto.precio)
    }
    
    onSave(productoData)
    resetForm()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-contenedor">
        <div className="modal-header">
          <h3 className="modal-titulo">Agregar Nuevo Producto</h3>
          <button onClick={handleClose} className="modal-cerrar">
            ×
          </button>
        </div>
        
        <div className="modal-body">
          {error && (
            <div className="error-mensaje">
              {error}
            </div>
          )}
          
          <div className="form-grupo">
            <label className="form-label">
              Nombre del Producto *
            </label>
            <input
              type="text"
              value={nuevoProducto.nombre}
              onChange={(e) => setNuevoProducto({...nuevoProducto, nombre: e.target.value})}
              className="form-input"
              placeholder="Ej: Shampoo Kerastase"
              autoFocus
            />
          </div>
          
          <div className="form-grupo">
            <label className="form-label">
              Descripción
            </label>
            <textarea
              value={nuevoProducto.descripcion}
              onChange={(e) => setNuevoProducto({...nuevoProducto, descripcion: e.target.value})}
              className="form-textarea"
              rows="3"
              placeholder="Descripción detallada del producto..."
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
              value={nuevoProducto.precio}
              onChange={(e) => setNuevoProducto({...nuevoProducto, precio: e.target.value})}
              className="form-input"
              placeholder="0.00"
            />
          </div>
        </div>
        
        <div className="modal-footer">
          <button
            onClick={handleClose}
            className="boton-secundario"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="boton-principal"
          >
            <span className="boton-icono">✓</span>
            Guardar Producto
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalAgregarProducto