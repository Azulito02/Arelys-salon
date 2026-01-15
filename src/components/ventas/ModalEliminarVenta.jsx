// components/ventas/ModalEliminarVenta.jsx
import React, { useState } from 'react'
import './ModalEliminarVenta.css'

const ModalEliminarVenta = ({
  isOpen,
  onClose,
  onConfirm,
  venta
}) => {
  const [loading, setLoading] = useState(false)
  const [confirmado, setConfirmado] = useState(false)

  if (!isOpen || !venta) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!confirmado) {
      alert('Debes confirmar que entiendes las consecuencias')
      return
    }

    setLoading(true)
    try {
      await onConfirm()
    } catch (error) {
      console.error('Error eliminando venta:', error)
      alert('❌ Error al eliminar venta')
    } finally {
      setLoading(false)
    }
  }

  const producto = venta.productos || {}

  // Función para mostrar detalles del método de pago
  const getDetallesPago = () => {
    if (venta.metodo_pago === 'efectivo') {
      return `Efectivo: $${venta.efectivo?.toFixed(2) || '0.00'}`;
    }
    if (venta.metodo_pago === 'tarjeta') {
      return `Tarjeta: $${venta.tarjeta?.toFixed(2) || '0.00'} (${venta.banco || 'Sin banco'})`;
    }
    if (venta.metodo_pago === 'transferencia') {
      return `Transferencia: $${venta.transferencia?.toFixed(2) || '0.00'} (${venta.banco || 'Sin banco'})`;
    }
    if (venta.metodo_pago === 'mixto') {
      const partes = [];
      if (venta.efectivo > 0) partes.push(`Efectivo: $${venta.efectivo?.toFixed(2)}`);
      if (venta.tarjeta > 0) partes.push(`Tarjeta: $${venta.tarjeta?.toFixed(2)}`);
      if (venta.transferencia > 0) partes.push(`Transferencia: $${venta.transferencia?.toFixed(2)}`);
      return partes.join(' | ');
    }
    return 'Sin método de pago';
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container-eliminar-venta">
        <div className="modal-header-eliminar-venta">
          <div className="modal-titulo-contenedor-eliminar">
            <div className="icono-alerta">
              <svg className="icono-alerta-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="modal-titulo-eliminar-venta">
              Eliminar Venta
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
        
        <form onSubmit={handleSubmit}>
          <div className="modal-contenido-eliminar-venta">
            {/* Advertencia */}
            <div className="advertencia-seccion">
              <svg className="advertencia-icono" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="advertencia-contenido">
                <h4 className="advertencia-titulo">¡Advertencia!</h4>
                <p className="advertencia-texto">
                  Estás a punto de eliminar permanentemente un registro de venta.
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            {/* Información de la venta */}
            <div className="venta-eliminar-info">
              <h4 className="venta-eliminar-titulo">Venta a Eliminar:</h4>
              <div className="venta-eliminar-detalles">
                <div className="detalle-eliminar-item">
                  <span className="detalle-etiqueta">Producto:</span>
                  <span className="detalle-valor">
                    {producto.nombre || 'Producto no encontrado'}
                  </span>
                </div>
                <div className="detalle-eliminar-item">
                  <span className="detalle-etiqueta">Cantidad:</span>
                  <span className="detalle-valor cantidad-eliminar">
                    {venta.cantidad} unidades
                  </span>
                </div>
                <div className="detalle-eliminar-item">
                  <span className="detalle-etiqueta">Precio unitario:</span>
                  <span className="detalle-valor">
                    ${venta.precio_unitario?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="detalle-eliminar-item">
                  <span className="detalle-etiqueta">Total:</span>
                  <span className="detalle-valor valor-total-eliminar">
                    ${venta.total?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="detalle-eliminar-item">
                  <span className="detalle-etiqueta">Método de pago:</span>
                  <span className="detalle-valor">
                    {venta.metodo_pago ? venta.metodo_pago.charAt(0).toUpperCase() + venta.metodo_pago.slice(1) : 'No especificado'}
                  </span>
                </div>
                <div className="detalle-eliminar-item">
                  <span className="detalle-etiqueta">Detalles pago:</span>
                  <span className="detalle-valor">
                    {getDetallesPago()}
                  </span>
                </div>
                {venta.banco && (
                  <div className="detalle-eliminar-item">
                    <span className="detalle-etiqueta">Banco:</span>
                    <span className="detalle-valor">{venta.banco}</span>
                  </div>
                )}
                <div className="detalle-eliminar-item">
                  <span className="detalle-etiqueta">Fecha:</span>
                  <span className="detalle-valor">
                    {new Date(venta.fecha).toLocaleString('es-MX', {
                      timeZone: 'America/Managua',
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

            {/* Consecuencias */}
            <div className="consecuencias-seccion">
              <h4 className="consecuencias-titulo">Consecuencias:</h4>
              <ul className="consecuencias-lista">
                <li className="consecuencia-item">
                  <svg className="consecuencia-icono" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Esta venta será eliminada permanentemente
                </li>
                <li className="consecuencia-item">
                  <svg className="consecuencia-icono" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  No se podrá recuperar la información
                </li>
                <li className="consecuencia-item">
                  <svg className="consecuencia-icono" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Los reportes de ventas se verán afectados
                </li>
              </ul>
            </div>

            {/* Confirmación */}
            <div className="confirmacion-seccion">
              <div className="checkbox-contenedor">
                <input
                  type="checkbox"
                  id="confirmar-eliminar-venta"
                  checked={confirmado}
                  onChange={(e) => setConfirmado(e.target.checked)}
                  className="checkbox-input"
                  disabled={loading}
                />
                <label htmlFor="confirmar-eliminar-venta" className="checkbox-label">
                  <div className="checkbox-custom"></div>
                  <span className="checkbox-texto">
                    Entiendo las consecuencias y deseo eliminar permanentemente esta venta
                  </span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="modal-footer-eliminar-venta">
            <button
              type="button"
              onClick={onClose}
              className="btn-secundario-eliminar"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-peligro"
              disabled={loading || !confirmado}
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
                  Eliminar Venta
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalEliminarVenta