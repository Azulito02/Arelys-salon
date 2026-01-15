import './ModalEliminarProducto.css'

const ModalEliminarProducto = ({ isOpen, onClose, onConfirm, producto }) => {
  if (!isOpen || !producto) return null

  return (
    <div className="modal-overlay">
      <div className="modal-contenedor modal-eliminar">
        <div className="modal-header">
          <h3 className="modal-titulo">Eliminar Producto</h3>
          <button onClick={onClose} className="modal-cerrar">
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
                ${parseFloat(producto.precio).toLocaleString('es-MX', { 
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
            onClick={onClose}
            className="boton-secundario"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="boton-peligro"
          >
            <span className="boton-icono">🗑️</span>
            Sí, eliminar producto
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalEliminarProducto