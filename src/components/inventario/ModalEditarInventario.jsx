import React, { useState, useEffect } from 'react'
import './ModalEditarInventario.css'

const ModalEditarInventario = ({
  isOpen,
  onClose,
  onSave,
  registro,
  productos
}) => {
  const [formData, setFormData] = useState({
    producto_id: '',
    entrada: 1
  })
  
  // 🔍 ESTADOS PARA BUSCADOR DE PRODUCTOS
  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [productosFiltrados, setProductosFiltrados] = useState([])
  const [mostrarResultados, setMostrarResultados] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Cargar datos del registro al abrir el modal
  useEffect(() => {
    if (registro) {
      setFormData({
        producto_id: registro.producto_id || '',
        entrada: registro.entrada || 1
      })
      
      // Establecer búsqueda con el producto actual
      const producto = productos.find(p => p.id === registro.producto_id)
      if (producto) {
        setBusquedaProducto(producto.nombre)
      }
      
      setError('')
    }
  }, [registro, productos])

  // 🔍 FILTRAR PRODUCTOS POR BÚSQUEDA
  useEffect(() => {
    if (busquedaProducto.trim() === '') {
      setProductosFiltrados([])
      setMostrarResultados(false)
      return
    }

    const termino = busquedaProducto.toLowerCase().trim()
    
    const filtrados = productos.filter(producto => {
      if (producto.nombre?.toLowerCase().includes(termino)) return true
      if (producto.categoria?.toLowerCase().includes(termino)) return true
      if (producto.codigo?.toLowerCase().includes(termino)) return true
      if (producto.codigo_barras?.toLowerCase().includes(termino)) return true
      return false
    })
    
    setProductosFiltrados(filtrados.slice(0, 10))
    setMostrarResultados(true)
  }, [busquedaProducto, productos])

  // 🔍 SELECCIONAR PRODUCTO
  const seleccionarProducto = (producto) => {
    setFormData({
      ...formData,
      producto_id: producto.id
    })
    setBusquedaProducto(producto.nombre)
    setProductosFiltrados([])
    setMostrarResultados(false)
    setError('')
  }

  if (!isOpen || !registro) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.producto_id) {
      setError('Selecciona un producto')
      return
    }

    if (formData.entrada < 1) {
      setError('La cantidad debe ser mayor a 0')
      return
    }

    setLoading(true)
    try {
      const datosActualizados = {
        producto_id: formData.producto_id,
        entrada: parseInt(formData.entrada)
      }
      
      await onSave(datosActualizados)
    } catch (error) {
      setError('Error al actualizar el registro')
      console.error('Error al actualizar:', error)
    } finally {
      setLoading(false)
    }
  }

  const productoSeleccionado = productos.find(p => p.id === formData.producto_id)
  const productoOriginal = registro.productos || {}

  return (
    <div className="modal-overlay">
      <div className="modal-container-editar-inventario">
        <div className="modal-header-editar-inventario">
          <div className="modal-titulo-contenedor">
            <svg className="modal-icono-editar" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <h3 className="modal-titulo-editar-inventario">
              Editar Entrada de Inventario
            </h3>
          </div>
          <button
            onClick={onClose}
            className="modal-cerrar-btn"
            disabled={loading}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-formulario">
          <div className="modal-contenido-editar-inventario">
            {/* Información del registro original */}
            <div className="registro-original-info">
              <h4 className="registro-original-titulo">REGISTRO ORIGINAL:</h4>
              <div className="registro-original-detalles">
                <div className="registro-detalle-item">
                  <span>Producto:</span>
                  <strong>{productoOriginal.nombre || 'Producto no encontrado'}</strong>
                </div>
                <div className="registro-detalle-item">
                  <span>Cantidad:</span>
                  <strong className="cantidad-original">{registro.entrada} unidades</strong>
                </div>
                <div className="registro-detalle-item">
                  <span>Fecha registro:</span>
                  <span>{new Date(registro.fecha).toLocaleString('es-MX')}</span>
                </div>
              </div>
            </div>

            <div className="separador">
              <span>Nuevos Datos</span>
            </div>

            {/* 🔍 BUSCADOR DE PRODUCTOS (REEMPLAZA AL SELECT) */}
            <div className="form-grupo">
              <label className="form-label">
                Buscar Producto *
              </label>
              <div className="busqueda-producto-container">
                <input
                  type="text"
                  value={busquedaProducto}
                  onChange={(e) => setBusquedaProducto(e.target.value)}
                  onFocus={() => busquedaProducto.trim() && setMostrarResultados(true)}
                  className="form-input-busqueda"
                  placeholder="Buscar producto por nombre, código o categoría..."
                  disabled={loading}
                  autoComplete="off"
                />
                {busquedaProducto && (
                  <button
                    type="button"
                    onClick={() => {
                      setBusquedaProducto('')
                      setFormData({...formData, producto_id: ''})
                      setProductosFiltrados([])
                      setMostrarResultados(false)
                    }}
                    className="boton-limpiar-busqueda"
                  >
                    ×
                  </button>
                )}
                
                {/* RESULTADOS DE BÚSQUEDA DE PRODUCTOS */}
                {mostrarResultados && productosFiltrados.length > 0 && (
                  <div className="resultados-busqueda">
                    {productosFiltrados.map((producto) => (
                      <div
                        key={producto.id}
                        className="resultado-item"
                        onClick={() => seleccionarProducto(producto)}
                      >
                        <div className="resultado-nombre">
                          <strong>{producto.nombre}</strong>
                          {producto.categoria && (
                            <span className="resultado-categoria"> ({producto.categoria})</span>
                          )}
                        </div>
                        <div className="resultado-info">
                          <span className="resultado-precio">${producto.precio?.toFixed(2) || '0.00'}</span>
                          {producto.codigo && (
                            <span className="resultado-codigo">📟 {producto.codigo}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {mostrarResultados && productosFiltrados.length === 0 && busquedaProducto.trim() !== '' && (
                  <div className="resultados-busqueda">
                    <div className="resultado-vacio">
                      No se encontraron productos con "{busquedaProducto}"
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="form-grupo">
              <label className="form-label">
                Nueva Cantidad *
              </label>
              <div className="input-group-cantidad">
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    entrada: Math.max(1, formData.entrada - 1)
                  })}
                  className="cantidad-btn"
                  disabled={loading}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={formData.entrada}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1
                    setFormData({...formData, entrada: Math.max(1, value)})
                    setError('')
                  }}
                  className="form-input-cantidad"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    entrada: formData.entrada + 1
                  })}
                  className="cantidad-btn"
                  disabled={loading}
                >
                  +
                </button>
              </div>
            </div>

            {/* Información del producto seleccionado */}
            {productoSeleccionado && (
              <div className="producto-info-actualizado">
                <h4 className="producto-info-titulo">Resumen Actualizado:</h4>
                <div className="producto-detalles-actualizado">
                  <div className="detalle-item-actualizado">
                    <span>Producto:</span>
                    <strong>{productoSeleccionado.nombre}</strong>
                  </div>
                  <div className="detalle-item-actualizado">
                    <span>Precio unitario:</span>
                    <strong>${productoSeleccionado.precio?.toFixed(2) || '0.00'}</strong>
                  </div>
                  <div className="detalle-item-actualizado">
                    <span>Cantidad:</span>
                    <strong>{formData.entrada} unidades</strong>
                  </div>
                  <div className="detalle-item-actualizado total-actualizado">
                    <span>Valor total:</span>
                    <strong className="valor-total-actualizado">
                      ${((productoSeleccionado.precio || 0) * formData.entrada).toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="error-mensaje">
                <svg className="error-icono" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
          </div>
          
          <div className="modal-footer-editar-inventario">
            <button
              type="button"
              onClick={onClose}
              className="btn-secundario"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primario-editar"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner-pequeno"></div>
                  Actualizando...
                </>
              ) : (
                <>
                  <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M5 13l4 4L19 7" />
                  </svg>
                  Actualizar Entrada
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalEditarInventario