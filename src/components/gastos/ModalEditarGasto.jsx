import React, { useState, useEffect } from 'react'
import './Gastos.css'

const ModalEditarGasto = ({ isOpen, onClose, onGastoEditado, gasto }) => {
  const [formData, setFormData] = useState({
    descripcion: '',
    monto: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (gasto) {
      setFormData({
        descripcion: gasto.descripcion || '',
        monto: gasto.monto || ''
      })
    }
  }, [gasto])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.descripcion.trim()) {
      alert('La descripción es requerida')
      return
    }
    
    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      alert('Ingresa un monto válido mayor a 0')
      return
    }

    setLoading(true)
    
    try {
      onGastoEditado(gasto.id, formData)
      handleClose()
    } catch (error) {
      console.error('Error editando gasto:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ descripcion: '', monto: '' })
    onClose()
  }

  if (!isOpen || !gasto) return null

  return (
    <div className="modal-overlay">
      <div className="modal-container gasto-modal">
        <div className="modal-header">
          <h3 className="modal-titulo">Editar Gasto</h3>
          <button onClick={handleClose} className="modal-cerrar">
            ×
          </button>
        </div>
        
        <div className="gasto-info">
          <p className="info-text">
            <strong>Fecha original:</strong> {new Date(gasto.fecha).toLocaleString('es-MX')}
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">
                Descripción *
              </label>
              <input
                type="text"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                className="form-input"
                placeholder="Ej: Compra de productos, pago de servicios, etc."
                required
                autoFocus
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">
                Monto (C$) *
              </label>
              <div className="monto-input-container">
                <span className="monto-prefijo">C$</span>
                <input
                  type="number"
                  name="monto"
                  value={formData.monto}
                  onChange={handleChange}
                  className="form-input monto-input"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner-small"></div>
                  Actualizando...
                </>
              ) : (
                'Actualizar Gasto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalEditarGasto