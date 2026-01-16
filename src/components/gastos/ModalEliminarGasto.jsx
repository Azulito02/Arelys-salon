import React, { useState } from 'react'
import './Gastos.css'

const ModalEliminarGasto = ({ isOpen, onClose, onGastoEliminado, gasto }) => {
  const [loading, setLoading] = useState(false)

  const handleEliminar = async () => {
    setLoading(true)
    try {
      onGastoEliminado(gasto.id)
      handleClose()
    } catch (error) {
      console.error('Error eliminando gasto:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onClose()
  }

  if (!isOpen || !gasto) return null

  return (
    <div className="modal-overlay">
      <div className="modal-container confirmacion-modal">
        <div className="modal-header">
          <h3 className="modal-titulo">Eliminar Gasto</h3>
          <button onClick={handleClose} className="modal-cerrar">
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <div className="confirmacion-icono">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <p className="confirmacion-texto">
            ¿Estás seguro de eliminar este gasto?
          </p>
          
          <div className="gasto-detalle">
            <div className="detalle-item">
              <span className="detalle-label">Descripción:</span>
              <strong className="detalle-valor">{gasto.descripcion}</strong>
            </div>
            <div className="detalle-item">
              <span className="detalle-label">Monto:</span>
              <strong className="detalle-valor negativo">-C${parseFloat(gasto.monto).toFixed(2)}</strong>
            </div>
            <div className="detalle-item">
              <span className="detalle-label">Fecha:</span>
              <span className="detalle-valor">
                {new Date(gasto.fecha).toLocaleString('es-MX')}
              </span>
            </div>
          </div>
          
          <div className="advertencia">
            <p className="advertencia-texto">
              ⚠️ Esta acción no se puede deshacer. El gasto será eliminado permanentemente.
            </p>
          </div>
        </div>
        
        <div className="modal-footer">
          <button
            onClick={handleClose}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleEliminar}
            className="btn btn-danger"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner-small"></div>
                Eliminando...
              </>
            ) : (
              'Sí, Eliminar Gasto'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalEliminarGasto