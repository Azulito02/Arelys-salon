import React, { useState, useEffect } from 'react'
import './ModalEntradaInventario.css'

const ModalEntradaInventario = ({
  isOpen,
  onClose,
  onSave,
  productos,
  entradaData,
  setEntradaData
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [productosFiltrados, setProductosFiltrados] = useState([])
  const [mostrarResultados, setMostrarResultados] = useState(false)

  // Resetear búsqueda cuando se cierra
  useEffect(() => {
    if (!isOpen) {
      setBusqueda('')
      setProductosFiltrados([])
      setMostrarResultados(false)
    }
  }, [isOpen])

  // Filtrar productos según búsqueda
  useEffect(() => {
    if (busqueda.trim() === '') {
      setProductosFiltrados([])
      setMostrarResultados(false)
      return
    }

    const termino = busqueda.toLowerCase().trim()
    
    const filtrados = productos.filter(producto => {
      if (producto.nombre?.toLowerCase().includes(termino)) return true
      if (producto.categoria?.toLowerCase().includes(termino)) return true
      if (producto.codigo_barras?.toLowerCase().includes(termino)) return true
      if (producto.codigo?.toLowerCase().includes(termino)) return true
      return false
    })
    
    setProductosFiltrados(filtrados)
    setMostrarResultados(true)
  }, [busqueda, productos])

  // Función para obtener precio del producto
  const obtenerPrecioProducto = (producto) => {
    if (producto.precio_venta !== undefined && producto.precio_venta !== null) {
      return parseFloat(producto.precio_venta)
    }
    if (producto.precio !== undefined && producto.precio !== null) {
      return parseFloat(producto.precio)
    }
    if (producto.precio_unitario !== undefined && producto.precio_unitario !== null) {
      return parseFloat(producto.precio_unitario)
    }
    return 0
  }

  // Seleccionar producto desde búsqueda
  const seleccionarProducto = (producto) => {
    setEntradaData({
      producto_id: producto.id,
      entrada: 1
    })
    setBusqueda('')
    setMostrarResultados(false)
    setError('')
  }

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validaciones
    if (!entradaData.producto_id) {
      setError('Debes seleccionar un producto')
      return
    }

    const cantidad = parseInt(entradaData.entrada)
    if (isNaN(cantidad) || cantidad < 1) {
      setError('La cantidad debe ser un número mayor a 0')
      return
    }

    setLoading(true)
    try {
      const entradaCompleta = {
        producto_id: entradaData.producto_id,
        entrada: cantidad
      }
      
      await onSave(entradaCompleta)
    } catch (error) {
      setError('Error al guardar la entrada. Intenta nuevamente.')
      console.error('Error en modal:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCantidadChange = (e) => {
    const value = e.target.value
    // Permite solo números y vacío temporalmente
    if (value === '' || /^[0-9\b]+$/.test(value)) {
      setEntradaData({
        ...entradaData, 
        entrada: value === '' ? '' : parseInt(value)
      })
    }
  }

  const incrementarCantidad = () => {
    const current = parseInt(entradaData.entrada) || 0
    setEntradaData({
      ...entradaData,
      entrada: current + 1
    })
  }

  const decrementarCantidad = () => {
    const current = parseInt(entradaData.entrada) || 1
    if (current > 1) {
      setEntradaData({
        ...entradaData,
        entrada: current - 1
      })
    }
  }

  const productoSeleccionado = productos.find(
    p => p.id === entradaData.producto_id
  )

  return (
    <div className="modal-overlay">
      <div className="modal-container-inventario">
        <div className="modal-header-inventario">
          <h3 className="modal-titulo-inventario">
            Nueva Entrada al Inventario
          </h3>
          <button
            onClick={onClose}
            className="modal-cerrar-btn"
            disabled={loading}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form-inventario">
          <div className="modal-contenido-inventario">
            {/* Mensaje de error */}
            {error && (
              <div className="error-mensaje-modal">
                <svg className="error-icono-modal" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <div className="form-grupo">
              <label className="form-label">
                Buscar Producto *
                <span className="hint-text"> (nombre, categoría, código)</span>
              </label>
              <div className="busqueda-producto-container">
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onFocus={() => {
                    if (busqueda.trim()) setMostrarResultados(true)
                  }}
                  className="form-input-busqueda"
                  placeholder="Escribe para buscar productos..."
                  disabled={loading}
                  autoFocus
                />
                {busqueda && (
                  <button
                    type="button"
                    onClick={() => {
                      setBusqueda('')
                      setProductosFiltrados([])
                      setMostrarResultados(false)
                    }}
                    className="boton-limpiar-busqueda"
                  >
                    ×
                  </button>
                )}
                
                {/* Resultados de búsqueda */}
                {mostrarResultados && productosFiltrados.length > 0 && (
                  <div className="resultados-busqueda">
                    {productosFiltrados.slice(0, 10).map((producto) => (
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
                          <span className="resultado-precio">${obtenerPrecioProducto(producto).toFixed(2)}</span>
                          {(producto.codigo_barras || producto.codigo) && (
                            <span className="resultado-codigo">📟 {producto.codigo_barras || producto.codigo}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {mostrarResultados && productosFiltrados.length === 0 && (
                  <div className="resultados-busqueda">
                    <div className="resultado-vacio">
                      No se encontraron productos con "{busqueda}"
                    </div>
                  </div>
                )}
              </div>
              <p className="form-ayuda">
                Busca y selecciona el producto que ingresará al inventario
              </p>
            </div>

            {/* Producto seleccionado */}
            {entradaData.producto_id && productoSeleccionado && (
              <div className="producto-seleccionado-card">
                <div className="producto-seleccionado-header">
                  <h4 className="producto-seleccionado-titulo">Producto Seleccionado</h4>
                  <button
                    type="button"
                    onClick={() => {
                      setEntradaData({ producto_id: '', entrada: 1 })
                      setBusqueda('')
                    }}
                    className="btn-cambiar-producto"
                    disabled={loading}
                  >
                    Cambiar
                  </button>
                </div>
                <div className="producto-seleccionado-detalles">
                  <div className="detalle-linea">
                    <span className="detalle-label">Nombre:</span>
                    <span className="detalle-valor">{productoSeleccionado.nombre}</span>
                  </div>
                  {productoSeleccionado.categoria && (
                    <div className="detalle-linea">
                      <span className="detalle-label">Categoría:</span>
                      <span className="detalle-valor">{productoSeleccionado.categoria}</span>
                    </div>
                  )}
                  {(productoSeleccionado.codigo_barras || productoSeleccionado.codigo) && (
                    <div className="detalle-linea">
                      <span className="detalle-label">Código:</span>
                      <span className="detalle-valor">
                        {productoSeleccionado.codigo_barras || productoSeleccionado.codigo}
                      </span>
                    </div>
                  )}
                  <div className="detalle-linea">
                    <span className="detalle-label">Precio:</span>
                    <span className="detalle-valor precio">${obtenerPrecioProducto(productoSeleccionado).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="form-grupo">
              <label className="form-label">
                Cantidad *
              </label>
              <div className="input-group-cantidad">
                <button
                  type="button"
                  onClick={decrementarCantidad}
                  className="cantidad-btn"
                  disabled={loading || !entradaData.producto_id}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={entradaData.entrada}
                  onChange={handleCantidadChange}
                  className="form-input-cantidad"
                  required
                  disabled={loading || !entradaData.producto_id}
                />
                <button
                  type="button"
                  onClick={incrementarCantidad}
                  className="cantidad-btn"
                  disabled={loading || !entradaData.producto_id}
                >
                  +
                </button>
              </div>
              <p className="form-ayuda">
                Ingresa la cantidad de unidades que se agregarán
              </p>
            </div>

            {/* Información del producto seleccionado */}
            {entradaData.producto_id && productoSeleccionado && (
              <div className="producto-info">
                <h4 className="producto-info-titulo">Resumen de la entrada:</h4>
                <div className="producto-detalles">
                  <div className="detalle-item">
                    <span>Producto:</span>
                    <strong>{productoSeleccionado.nombre}</strong>
                  </div>
                  <div className="detalle-item">
                    <span>Precio unitario:</span>
                    <strong>${obtenerPrecioProducto(productoSeleccionado).toFixed(2)}</strong>
                  </div>
                  <div className="detalle-item">
                    <span>Cantidad:</span>
                    <strong>{entradaData.entrada} unidades</strong>
                  </div>
                  <div className="detalle-item total">
                    <span>Valor total:</span>
                    <strong className="valor-total">
                      ${(obtenerPrecioProducto(productoSeleccionado) * (parseInt(entradaData.entrada) || 0)).toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="modal-footer-inventario">
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
              className="btn-primario-inventario"
              disabled={loading || !entradaData.producto_id || !entradaData.entrada}
            >
              {loading ? (
                <>
                  <div className="spinner-pequeno-modal"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M5 13l4 4L19 7" />
                  </svg>
                  Registrar Entrada
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalEntradaInventario