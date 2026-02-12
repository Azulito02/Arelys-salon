import React, { useState, useEffect } from 'react'
import './ModalEliminarProducto.css'

const ModalEliminarProducto = ({ isOpen, onClose, onConfirm, producto }) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  
  // ✅ LIMPIAR TODO CUANDO SE CIERRA EL MODAL
  useEffect(() => {
    if (!isOpen) {
      setIsDeleting(false)
      setError('')
    }
  }, [isOpen])

  if (!isOpen || !producto) return null

  const handleConfirm = async () => {
    setIsDeleting(true)
    setError('')
    
    try {
      await onConfirm()
      // Si todo sale bien, el padre debe cerrar el modal
    } catch (error) {
      console.error('Error al eliminar producto:', error)
      
      // ✅ DETECTAR ERROR DE CLAVE FORÁNEA
      let mensajeError = ''
      if (error.message?.includes('foreign key constraint') || 
          error.message?.includes('ventas_credito') ||
          error.code === '23503') {
        mensajeError = '❌ No se puede eliminar este producto porque tiene ventas o créditos asociados.'
      } else {
        mensajeError = error.message || 'Error al eliminar el producto'
      }
      
      setError(mensajeError)
      setIsDeleting(false) // ✅ IMPORTANTE: Desactivar el estado de carga
    }
  }

  const handleClose = (e) => {
    e?.stopPropagation()
    // ✅ SIEMPRE PERMITIR CERRAR, SIN IMPORTAR EL ESTADO
    setError('')
    setIsDeleting(false)
    onClose()
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      // ✅ SIEMPRE PERMITIR CERRAR HACIENDO CLICK FUERA
      setError('')
      setIsDeleting(false)
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
            disabled={false} // ✅ NUNCA DESHABILITAR EL BOTÓN DE CERRAR
            type="button"
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <div className="advertencia-icono">⚠️</div>
          
          <h4 className="advertencia-titulo">
            ¿Estás seguro de eliminar este producto?
          </h4>
          
          <div className="producto-info">
            <div className="info-item">
              <span className="info-label">Descripción:</span>
              <span className="info-valor">{producto.descripcion || 'Sin descripción'}</span>
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
          
          {/* ✅ MOSTRAR ERROR SI EXISTE */}
          {error ? (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '16px',
              marginTop: '20px',
              color: '#dc2626',
              textAlign: 'center',
              fontWeight: '500'
            }}>
              {error}
            </div>
          ) : (
            <div className="advertencia-mensaje">
              Esta acción no se puede deshacer. El producto será eliminado permanentemente.
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button
            onClick={handleClose}
            className="boton-secundario"
            disabled={false} // ✅ NUNCA DESHABILITAR
            type="button"
          >
            Cancelar
          </button>
          
          {error ? (
            <button
              onClick={handleClose}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Entendido
            </button>
          ) : (
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
                'Sí, eliminar producto'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ModalEliminarProducto