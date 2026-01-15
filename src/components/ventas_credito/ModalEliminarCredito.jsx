import React, { useState } from 'react'
import { supabase } from '../../database/supabase'
import './ModalEliminarCredito.css'

const ModalEliminarCredito = ({ isOpen, onClose, onCreditoEliminado, credito }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen || !credito) return null

  const handleEliminar = async () => {
    setLoading(true)
    setError('')

    try {
      const { error: supabaseError } = await supabase
        .from('ventas_credito')
        .delete()
        .eq('id', credito.id)
      
      if (supabaseError) throw supabaseError
      
      onCreditoEliminado()
    } catch (err) {
      console.error('Error eliminando crédito:', err)
      setError('Error al eliminar el crédito. Por favor intenta de nuevo.')
      setLoading(false)
    }
  }

  const getEstadoCredito = () => {
    const hoy = new Date()
    const fin = new Date(credito.fecha_fin)
    
    if (hoy > fin) {
      return { texto: 'Vencido', clase: 'estado-vencido' }
    } else if ((fin - hoy) / (1000 * 60 * 60 * 24) <= 3) {
      return { texto: 'Por vencer', clase: 'estado-por-vencer' }
    } else {
      return { texto: 'Activo', clase: 'estado-activo' }
    }
  }

  const estado = getEstadoCredito()

  return (
    <div className="modal-overlay">
      <div className="modal-container-eliminar-credito">
        <div className="modal-header-eliminar-credito">
          <div className="modal-titulo-contenedor">
            <svg className="modal-icono-eliminar" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <h3 className="modal-titulo-eliminar-credito">Eliminar Crédito</h3>
          </div>
          <button onClick={onClose} className="modal-cerrar-btn" disabled={loading}>
            &times;
          </button>
        </div>
        
        <div className="modal-contenido-eliminar-credito">
          {error && (
            <div className="error-mensaje">
              <svg className="error-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
          
          <div className="advertencia-eliminar">
            <svg className="icon-advertencia" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="advertencia-contenido">
              <h4 className="advertencia-titulo">¿Estás seguro de eliminar este crédito?</h4>
              <p className="advertencia-descripcion">
                Esta acción eliminará permanentemente el registro de crédito y no se puede deshacer.
              </p>
            </div>
          </div>
          
          <div className="info-credito-eliminar">
            <div className="info-item-eliminar">
              <span className="info-label-eliminar">Cliente:</span>
              <span className="info-valor-eliminar">{credito.nombre_cliente}</span>
            </div>
            <div className="info-item-eliminar">
              <span className="info-label-eliminar">Producto:</span>
              <span className="info-valor-eliminar">{credito.productos?.nombre || 'Producto no encontrado'}</span>
            </div>
            <div className="info-item-eliminar">
              <span className="info-label-eliminar">Cantidad:</span>
              <span className="info-valor-eliminar">{credito.cantidad} unidades</span>
            </div>
            <div className="info-item-eliminar">
              <span className="info-label-eliminar">Precio unitario:</span>
              <span className="info-valor-eliminar">${parseFloat(credito.precio_unitario).toFixed(2)}</span>
            </div>
            <div className="info-item-eliminar">
              <span className="info-label-eliminar">Total:</span>
              <span className="info-valor-eliminar">${parseFloat(credito.total).toFixed(2)}</span>
            </div>
            <div className="info-item-eliminar">
              <span className="info-label-eliminar">Fecha Fin:</span>
              <span className="info-valor-eliminar">
                {new Date(credito.fecha_fin).toLocaleDateString('es-MX')}
              </span>
            </div>
            <div className="info-item-eliminar">
              <span className="info-label-eliminar">Estado:</span>
              <span className={`badge-estado-eliminar ${estado.clase}`}>
                {estado.texto}
              </span>
            </div>
          </div>
          
          <div className="consecuencias-eliminar">
            <div className="consecuencia-item">
              <svg className="consecuencia-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>El registro será eliminado permanentemente</span>
            </div>
            <div className="consecuencia-item">
              <svg className="consecuencia-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>No se podrá recuperar la información</span>
            </div>
            <div className="consecuencia-item">
              <svg className="consecuencia-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Se eliminará del historial de créditos</span>
            </div>
          </div>
        </div>
        
        <div className="modal-footer-eliminar-credito">
          <button
            type="button"
            onClick={onClose}
            className="btn-secundario"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleEliminar}
            className="btn-peligro-credito"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner-pequeno"></div>
                Eliminando...
              </>
            ) : (
              <>
                <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Eliminar Crédito
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalEliminarCredito