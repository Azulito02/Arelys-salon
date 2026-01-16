import React, { useState } from 'react'
import './Gastos.css'

const ModalAgregarGasto = ({ isOpen, onClose, onGastoAgregado }) => {
  const [formData, setFormData] = useState({
    descripcion: '',
    monto: ''
  })
  const [loading, setLoading] = useState(false)

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
      // La inserción se manejará en el componente padre
      onGastoAgregado(formData)
      handleClose()
    } catch (error) {
      console.error('Error en formulario:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ descripcion: '', monto: '' })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-container gasto-modal">
        <div className="modal-header">
          <h3 className="modal-titulo">Nuevo Gasto</h3>
          <button onClick={handleClose} className="modal-cerrar">
            ×
          </button>
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
            
            <div className="form-hints">
              <p className="hint-text">
                💡 <strong>Tip:</strong> Sé específico con la descripción para un mejor seguimiento.
              </p>
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
                  Registrando...
                </>
              ) : (
                'Registrar Gasto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalAgregarGasto