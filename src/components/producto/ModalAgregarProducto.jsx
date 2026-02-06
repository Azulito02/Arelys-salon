import { useState } from 'react'
import './ModalAgregarProducto.css'

const ModalAgregarProductos = ({ isOpen, onClose, onSave }) => {
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

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    categoria: 'General',
    descripcion: '',
    precio: '',
    codigo_barras: ''
  });
  
  const [error, setError] = useState('') // CORRECCIÓN: Agregar 'const' aquí

  const handleSubmit = () => {
    if (!nuevoProducto.nombre.trim()) {
      setError('El nombre del producto es obligatorio')
      return
    }
    
    if (!nuevoProducto.precio || parseFloat(nuevoProducto.precio) <= 0) {
      setError('El precio debe ser mayor a 0')
      return
    }
    
    const productoData = {
      nombre: nuevoProducto.nombre.trim(),
      descripcion: nuevoProducto.descripcion.trim() || '',
      precio: parseFloat(nuevoProducto.precio),
      categoria: nuevoProducto.categoria,
      codigo_barras: nuevoProducto.codigo_barras.trim() || null
    };
    
    onSave(productoData)
    setNuevoProducto({
      nombre: '',
      categoria: 'General',
      descripcion: '',
      precio: ''
    })
    setError('')
  }

  if (!isOpen) return null

  return (
    <div className="modal-agregar-overlay">
      <div className="modal-agregar-contenedor">
        <div className="modal-agregar-header">
          <h2>Agregar Nuevo Producto</h2>
        </div>
        
        <div className="modal-agregar-body">
          {error && (
            <div className="error-mensaje">
              {error}
            </div>
          )}
          
          <div className="campo-formulario">
            <div className="label-contenedor">
              <label className="label-campo">
                <strong>Nombre del Producto*</strong>
              </label>
            </div>
            <input
              type="text"
              value={nuevoProducto.nombre}
              onChange={(e) => setNuevoProducto({...nuevoProducto, nombre: e.target.value})}
              className="input-campo"
              placeholder="Ej: Keratina Profesional"
              autoFocus
            />
          </div>
          
          <div className="campo-formulario">
            <div className="label-contenedor">
              <label className="label-campo">
                <strong>Categoría</strong>
              </label>
            </div>
            <select
              value={nuevoProducto.categoria}
              onChange={(e) => setNuevoProducto({...nuevoProducto, categoria: e.target.value})}
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
                <strong>Descripción(opcional)</strong>
              </label>
            </div>
            <textarea
              value={nuevoProducto.descripcion}
              onChange={(e) => setNuevoProducto({...nuevoProducto, descripcion: e.target.value})}
              className="textarea-campo"
              rows="4"
              placeholder="Describe el producto: características, beneficios, uso..."
            />
          </div>
          
          <div className="campo-formulario">
            <div className="label-contenedor">
              <label className="label-campo">
                <strong>Precio ($)*</strong>
              </label>
            </div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={nuevoProducto.precio}
              onChange={(e) => setNuevoProducto({...nuevoProducto, precio: e.target.value})}
              className="input-campo"
              placeholder="0.00"
            />
          </div>

          <div className="campo-formulario">
            <div className="label-contenedor">
              <label className="label-campo">
                <strong>Código de Barras (opcional)</strong>
              </label>
            </div>
            <input
              type="text"
              value={nuevoProducto.codigo_barras}
              onChange={(e) => setNuevoProducto({...nuevoProducto, codigo_barras: e.target.value})}
              className="input-campo"
              placeholder="Escanear o ingresar manualmente"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && nuevoProducto.codigo_barras.trim()) {
                  e.preventDefault();
                }
              }}
            />
            <small className="texto-ayuda">
              Escanear con la pistola o ingresar manualmente
            </small>
          </div>
        </div>
        
        <div className="modal-agregar-footer">
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
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalAgregarProductos