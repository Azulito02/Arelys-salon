import React, { useState } from 'react'
import './ModalEliminarInventario.css'

const ModalEliminarInventario = ({
  isOpen,
  onClose,
  onConfirm,
  registro
}) => {
  const [loading, setLoading] = useState(false)
  const [confirmado, setConfirmado] = useState(false)

  if (!isOpen || !registro) return null

  const handleConfirmar = async () => {
    if (!confirmado) {
      alert('Debes marcar la casilla de confirmación para eliminar')
      return
    }

    setLoading(true)
    try {
      await onConfirm()
    } catch (error) {
      console.error('Error al eliminar:', error)
      alert('Error al eliminar el registro')
    } finally {
      setLoading(false)
    }
  }

  const producto = registro.productos || {}
  const fechaRegistro = new Date(registro.fecha).toLocaleString('es-MX')

  return (
    <div className="modal-overlay">
      <div className="modal-container-eliminar-inventario">
        <div className="modal-header-eliminar-inventario">
          <div className="modal-titulo-contenedor-eliminar">
            <div className="icono-alerta">
              <svg className="icono-alerta-svg" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="modal-titulo-eliminar-inventario">
              Eliminar Entrada de Inventario
            </h3>
          </div>
          <button
            onClick={onClose}
            className="modal-cerrar-btn-eliminar"
            disabled={loading}
          >
            ×
          </button>
        </div>
        
        <div className="modal-contenido-eliminar-inventario">
          <div className="advertencia-seccion">
            <div className="advertencia-icono">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="advertencia-contenido">
              <h4 className="advertencia-titulo">¡Atención!</h4>
              <p className="advertencia-texto">
                Estás a punto de eliminar permanentemente una entrada del inventario. 
                Esta acción no se puede deshacer.
              </p>
            </div>
          </div>

          {/* Información del registro a eliminar */}
          <div className="registro-eliminar-info">
            <h4 className="registro-eliminar-titulo">Detalles del registro:</h4>
            <div className="registro-eliminar-detalles">
              <div className="detalle-eliminar-item">
                <span className="detalle-etiqueta">Producto:</span>
                <span className="detalle-valor">{producto.nombre || 'Producto no encontrado'}</span>
              </div>
              <div className="detalle-eliminar-item">
                <span className="detalle-etiqueta">Cantidad:</span>
                <span className="detalle-valor cantidad-eliminar">{registro.entrada} unidades</span>
              </div>
              <div className="detalle-eliminar-item">
                <span className="detalle-etiqueta">Precio unitario:</span>
                <span className="detalle-valor">${producto.precio?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="detalle-eliminar-item">
                <span className="detalle-etiqueta">Valor total:</span>
                <span className="detalle-valor valor-total-eliminar">
                  ${((producto.precio || 0) * registro.entrada).toFixed(2)}
                </span>
              </div>
              <div className="detalle-eliminar-item">
                <span className="detalle-etiqueta">Fecha registro:</span>
                <span className="detalle-valor">{fechaRegistro}</span>
              </div>
            </div>
          </div>

          {/* Consecuencias */}
          <div className="consecuencias-seccion">
            <h4 className="consecuencias-titulo">Esta acción eliminará:</h4>
            <ul className="consecuencias-lista">
              <li className="consecuencia-item">
                <svg className="consecuencia-icono" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                El registro del historial de inventario
              </li>
              <li className="consecuencia-item">
                <svg className="consecuencia-icono" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                La información de entrada del producto
              </li>
              <li className="consecuencia-item">
                <svg className="consecuencia-icono" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                Los datos relacionados con este registro
              </li>
            </ul>
          </div>

          {/* Confirmación */}
          <div className="confirmacion-seccion">
            <div className="checkbox-contenedor">
              <input
                type="checkbox"
                id="confirmar-eliminar"
                checked={confirmado}
                onChange={(e) => setConfirmado(e.target.checked)}
                disabled={loading}
                className="checkbox-input"
              />
              <label htmlFor="confirmar-eliminar" className="checkbox-label">
                <span className="checkbox-custom"></span>
                <span className="checkbox-texto">
                  Confirmo que deseo eliminar permanentemente este registro de inventario
                </span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="modal-footer-eliminar-inventario">
          <button
            type="button"
            onClick={onClose}
            className="btn-secundario-eliminar"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            className="btn-peligro"
            disabled={!confirmado || loading}
          >
            {loading ? (
              <>
                <div className="spinner-pequeno-peligro"></div>
                Eliminando...
              </>
            ) : (
              <>
                <svg className="btn-icon-peligro" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Eliminar Permanentemente
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalEliminarInventario