import React, { useState, useEffect } from 'react'
import './ModalEliminarProducto.css' // <-- Asegúrate de importar este CSS

const ModalEliminarProducto = ({ isOpen, onClose, onConfirm, producto }) => {
  const [isDeleting, setIsDeleting] = useState(false)
  
  useEffect(() => {
    if (!isOpen) {
      setIsDeleting(false)
    }
  }, [isOpen])

  if (!isOpen || !producto) return null

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
      // El cierre lo maneja el componente padre
    } catch (error) {
      console.error('Error al eliminar producto:', error)
      alert('Error al eliminar el producto')
      setIsDeleting(false)
    }
  }

  const handleClose = (e) => {
    e.stopPropagation()
    if (!isDeleting) {
      onClose()
    }
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-contenedor" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-titulo">Eliminar Producto</h3>
          <button 
            onClick={handleClose}
            className="modal-cerrar"
            disabled={isDeleting}
            type="button"
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <div className="advertencia-icono">
            ⚠️
          </div>
          
          <h4 className="advertencia-titulo">
            ¿Estás seguro de eliminar este producto?
          </h4>
          
          <div className="producto-info">
            <div className="info-item">
              <span className="info-label">Nombre:</span>
              <span className="info-valor">{producto.nombre}</span>
            </div>
            
            <div className="info-item">
              <span className="info-label">Categoría:</span>
              <span className="info-valor">
                {producto.categoria || 'General'}
              </span>
            </div>
            
            <div className="info-item">
              <span className="info-label">Descripción:</span>
              <span className="info-valor">
                {producto.descripcion || 'Sin descripción'}
              </span>
            </div>
            
            <div className="info-item">
              <span className="info-label">Precio:</span>
              <span className="info-valor precio">
                C${parseFloat(producto.precio || 0).toLocaleString('es-MX', { 
                  minimumFractionDigits: 2 
                })}
              </span>
            </div>
          </div>
          
          <div className="advertencia-mensaje">
            Esta acción no se puede deshacer. El producto será eliminado permanentemente.
          </div>
        </div>
        
        <div className="modal-footer">
          <button
            onClick={handleClose}
            className="boton-secundario"
            disabled={isDeleting}
            type="button"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="boton-peligro"
            disabled={isDeleting}
            type="button"
          >
            {isDeleting ? (
              <>
                <span className="spinner"></span>
                Eliminando...
              </>
            ) : (
              <>
                <span className="boton-icono">🗑️</span>
                Sí, eliminar producto
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalEliminarProducto