import { useState, useEffect } from 'react'
import './ModalEditarProducto.css'

const ModalEditarProducto = ({ isOpen, onClose, onSave, producto }) => {
  const categoriasDisponibles = [
    'General',
    'Shampoo',
    'Acondicionador',
    'Tratamiento',
    'Tinte',
    'Fijador',
    'Mascarilla',
    'Crema',
    'Gel',
    'Espuma',
    'Aceite',
    'Kit',
    'Otro'
  ]

  const [productoEditado, setProductoEditado] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria: 'General'
  })
  const [error, setError] = useState('')


useEffect(() => {
  if (producto) {
    setProductoEditado({
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      precio: producto.precio || '',
      categoria: producto.categoria || 'General',
      codigo_barras: producto.codigo_barras || ''
    })
    setError('')
  }
}, [producto])

  if (!isOpen || !producto) return null

  const handleSubmit = () => {
    if (!productoEditado.nombre.trim()) {
      setError('El nombre del producto es obligatorio')
      return
    }
    
    if (!productoEditado.precio || parseFloat(productoEditado.precio) <= 0) {
      setError('El precio debe ser mayor a 0')
      return
    }
    

    // En handleSubmit
const productoData = {
  nombre: productoEditado.nombre.trim(),
  descripcion: productoEditado.descripcion.trim() || null,
  precio: parseFloat(productoEditado.precio),
  categoria: productoEditado.categoria,
  codigo_barras: productoEditado.codigo_barras.trim() || null
};
    
    onSave(productoData)
  }

  return (
    <div className="modal-editar-overlay">
      <div className="modal-editar-contenedor">
        <div className="modal-editar-header">
          <h2>Editar Producto</h2>
        </div>
        
        <div className="modal-editar-body">
          {error && (
            <div className="error-mensaje">
              {error}
            </div>
          )}
          
          <div className="info-producto">
            <div className="label-contenedor">
              <label className="label-campo">
                <strong>ID del Producto:</strong>
              </label>
            </div>
            <div className="info-valor">
              {producto.id.substring(0, 8)}...
            </div>
          </div>
          
          <div className="campo-formulario">
            <div className="label-contenedor">
              <label className="label-campo">
                <strong>Nombre del Producto:</strong>
              </label>
            </div>
            <input
              type="text"
              value={productoEditado.nombre}
              onChange={(e) => setProductoEditado({...productoEditado, nombre: e.target.value})}
              className="input-campo"
              placeholder="Ej: Keratina Profesional"
              autoFocus
            />
          </div>
          
          <div className="campo-formulario">
            <div className="label-contenedor">
              <label className="label-campo">
                <strong>Categoría:</strong>
              </label>
            </div>
            <select
              value={productoEditado.categoria}
              onChange={(e) => setProductoEditado({...productoEditado, categoria: e.target.value})}
              className="select-campo"
            >
              {categoriasDisponibles.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
          </div>
          
          <div className="campo-formulario">
            <div className="label-contenedor">
              <label className="label-campo">
                <strong>Descripción:</strong>
              </label>
            </div>
            <textarea
              value={productoEditado.descripcion}
              onChange={(e) => setProductoEditado({...productoEditado, descripcion: e.target.value})}
              className="textarea-campo"
              rows="3"
              placeholder="Describe el producto: características, beneficios, uso..."
            />
          </div>
          
          <div className="campo-formulario">
            <div className="label-contenedor">
              <label className="label-campo">
                <strong>Precio (C$):</strong>
              </label>
            </div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={productoEditado.precio}
              onChange={(e) => setProductoEditado({...productoEditado, precio: e.target.value})}
              className="input-campo"
              placeholder="0.00"
            />
          </div>


              // Agregar el campo en el formulario
<div className="campo-formulario">
  <div className="label-contenedor">
    <label className="label-campo">
      <strong>Código de Barras</strong>
    </label>
  </div>
  <input
    type="text"
    value={productoEditado.codigo_barras}
    onChange={(e) => setProductoEditado({...productoEditado, codigo_barras: e.target.value})}
    className="input-campo"
    placeholder="Escanear o ingresar manualmente"
  />
  <small className="texto-ayuda">
    {productoEditado.codigo_barras ? 
      `Código actual: ${productoEditado.codigo_barras}` : 
      'No tiene código asignado'}
  </small>
</div>


        </div>
        
        <div className="modal-editar-footer">
          <button
            onClick={onClose}
            className="boton-cancelar"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="boton-guardar"
          >
            Actualizar Producto
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalEditarProducto