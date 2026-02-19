import React, { useState, useEffect } from 'react'
import './TablaProductos.css'

const TablaProductos = ({ productos, loading, onEditar, onEliminar }) => {
  const [busqueda, setBusqueda] = useState('')
  const [productosFiltrados, setProductosFiltrados] = useState([])
  const [filtroActivo, setFiltroActivo] = useState('todos')

  // Filtrar productos según búsqueda y filtro
  useEffect(() => {
    let filtrados = [...productos]
    
    // Aplicar filtro de categoría
    if (filtroActivo !== 'todos') {
      if (filtroActivo === 'con-categoria') {
        filtrados = filtrados.filter(p => p.categoria)
      } else if (filtroActivo === 'sin-categoria') {
        filtrados = filtrados.filter(p => !p.categoria)
      } else if (filtroActivo === 'precio-alto') {
        filtrados = filtrados.filter(p => parseFloat(p.precio) > 500)
      } else if (filtroActivo === 'precio-bajo') {
        filtrados = filtrados.filter(p => parseFloat(p.precio) <= 500)
      } else if (filtroActivo === 'con-codigo') {
        filtrados = filtrados.filter(p => p.codigo_barras)
      } else if (filtroActivo === 'sin-codigo') {
        filtrados = filtrados.filter(p => !p.codigo_barras)
      }
    }
    
    // Aplicar búsqueda de texto
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase()
      filtrados = filtrados.filter(producto => 
        producto.nombre?.toLowerCase().includes(termino) ||
        producto.descripcion?.toLowerCase().includes(termino) ||
        producto.categoria?.toLowerCase().includes(termino) ||
        producto.codigo_barras?.toLowerCase().includes(termino) ||
        producto.precio?.toString().includes(termino)
      )
    }
    
    setProductosFiltrados(filtrados)
  }, [busqueda, productos, filtroActivo])

  // Calcular estadísticas
  const calcularEstadisticas = () => {
    const totalProductos = productos.length
    const totalFiltrados = productosFiltrados.length
    const totalConCategoria = productos.filter(p => p.categoria).length
    const totalConCodigo = productos.filter(p => p.codigo_barras).length
    const promedioPrecio = productos.length > 0 
      ? productos.reduce((sum, p) => sum + parseFloat(p.precio), 0) / productos.length
      : 0
    
    return { totalProductos, totalFiltrados, totalConCategoria, totalConCodigo, promedioPrecio }
  }

  const estadisticas = calcularEstadisticas()

  // Formatear precio
  const formatPrecio = (precio) => {
    return parseFloat(precio).toLocaleString('es-MX', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })
  }

  // Copiar código de barras al portapapeles
  const copiarCodigoBarras = (codigo) => {
    navigator.clipboard.writeText(codigo)
      .then(() => {
        alert(`Código de barras copiado: ${codigo}`)
      })
      .catch(err => {
        console.error('Error al copiar:', err)
      })
  }

  // Renderizar productos para vista móvil
  const renderProductosMobile = () => {
    if (loading) {
      return (
        <div className="productos-cargando-mobile">
          <div className="spinner"></div>
          <p>Cargando productos...</p>
        </div>
      );
    }

    if (productosFiltrados.length === 0) {
      return (
        <div className="productos-vacio-mobile">
          <p>
            {busqueda || filtroActivo !== 'todos' 
              ? 'No se encontraron productos con los filtros aplicados' 
              : 'No hay productos registrados'
            }
          </p>
        </div>
      );
    }

    return productosFiltrados.map((producto) => (
      <div key={producto.id} className="producto-card">
        <div className="producto-card-header">
          <div className="producto-card-info">
            <div className="producto-card-nombre">{producto.nombre}</div>
            <span className={`producto-card-categoria ${producto.categoria ? 'activa' : 'sin-categoria'}`}>
              {producto.categoria || 'Sin categoría'}
            </span>
          </div>
          <div className="producto-card-precio">
            C${formatPrecio(producto.precio)}
          </div>
        </div>
        
        {/* Código de barras en móvil */}
        {producto.codigo_barras && (
          <div 
            className="producto-card-codigo-barras"
            onClick={() => copiarCodigoBarras(producto.codigo_barras)}
            style={{ cursor: 'pointer' }}
            title="Haz clic para copiar"
          >
            <span className="codigo-barras-icono">📋</span>
            <span className="codigo-barras-texto">{producto.codigo_barras}</span>
          </div>
        )}
        
        {producto.descripcion && (
          <div className="producto-card-descripcion">
            {producto.descripcion}
          </div>
        )}
        
        <div className="producto-card-actions">
          <button
            onClick={() => onEditar(producto)}
            className="producto-action-btn editar"
          >
            <span>✏️</span>
            Editar
          </button>
          <button
            onClick={() => onEliminar(producto)}
            className="producto-action-btn eliminar"
          >
            <span>🗑️</span>
            Eliminar
          </button>
        </div>
      </div>
    ));
  };

  return (
    <div className="productos-container">
      {/* BUSCADOR PARA DESKTOP */}
      <div className="buscador-productos desktop-only">
        <div className="buscador-productos-container">
          <svg className="buscador-productos-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, categoría, código de barras o precio..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="buscador-productos-input"
          />
          {busqueda && (
            <button 
              onClick={() => setBusqueda('')}
              className="buscador-productos-limpiar"
              title="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>
        
        <div className="contador-productos">
          <span>
            {busqueda || filtroActivo !== 'todos' 
              ? `Mostrando ${productosFiltrados.length} de ${productos.length} productos` 
              : `${productos.length} productos`
            }
          </span>
          <span>
            {busqueda && `Búsqueda: "${busqueda}"`}
          </span>
        </div>
        
        {/* Filtros adicionales */}
        <div className="filtros-productos">
          <button 
            className={`filtro-btn ${filtroActivo === 'todos' ? 'activo' : ''}`}
            onClick={() => setFiltroActivo('todos')}
          >
            Todos
          </button>
          <button 
            className={`filtro-btn ${filtroActivo === 'con-categoria' ? 'activo' : ''}`}
            onClick={() => setFiltroActivo('con-categoria')}
          >
            Por categoría
          </button>
          
        </div>
      </div>

      {/* BUSCADOR PARA MÓVIL */}
      <div className="buscador-productos-mobile mobile-only">
        <div className="buscador-productos-mobile-container">
          <svg className="buscador-productos-mobile-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar productos o código de barras..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="buscador-productos-mobile-input"
          />
          {busqueda && (
            <button 
              onClick={() => setBusqueda('')}
              className="buscador-productos-mobile-limpiar"
              title="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Contador móvil */}
      <div className="contador-productos-mobile mobile-only">
        {busqueda || filtroActivo !== 'todos' 
          ? `${productosFiltrados.length} de ${productos.length} productos` 
          : `${productos.length} productos`
        }
      </div>

      {/* VISTA DESKTOP */}
      <div className="tabla-contenedor desktop-only">
        <div className="tabla-scroll">
          <table className="tabla-productos">
            <thead>
              <tr>
                <th className="columna-nombre">Nombre</th>
                <th className="columna-codigo-barras">Código Barras</th>
                <th className="columna-categoria">Categoría</th>
                <th className="columna-descripcion">Descripción</th>
                <th className="columna-precio">Precio</th>
                <th className="columna-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="tabla-cargando">
                    <div className="spinner"></div>
                    <span>Cargando productos...</span>
                  </td>
                </tr>
              ) : productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="tabla-vacia">
                    {busqueda || filtroActivo !== 'todos' 
                      ? 'No se encontraron productos con los filtros aplicados' 
                      : 'No hay productos registrados'
                    }
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((producto) => (
                  <tr key={producto.id} className="fila-producto">
                    <td className="celda-nombre">
                      <div className="producto-nombre">{producto.nombre}</div>
                    </td>
                    <td className="celda-codigo-barras">
                      <div 
                        className="producto-codigo-barras"
                        onClick={() => producto.codigo_barras && copiarCodigoBarras(producto.codigo_barras)}
                        style={{ cursor: producto.codigo_barras ? 'pointer' : 'default' }}
                        title={producto.codigo_barras ? "Haz clic para copiar" : ""}
                      >
                        {producto.codigo_barras ? (
                          <span className="codigo-barras-activo">
                            📋 {producto.codigo_barras}
                          </span>
                        ) : (
                          <span className="codigo-barras-sin">Sin código</span>
                        )}
                      </div>
                    </td>
                    <td className="celda-categoria">
                      <div className="producto-categoria">
                        <span className={`categoria-badge ${producto.categoria ? 'categoria-activa' : 'sin-categoria'}`}>
                          {producto.categoria || 'Sin categoría'}
                        </span>
                      </div>
                    </td>
                    <td className="celda-descripcion">
                      <div className="producto-descripcion">
                        {producto.descripcion || 'Sin descripción'}
                      </div>
                    </td>
                    <td className="celda-precio">
                      <div className="producto-precio">
                        C${formatPrecio(producto.precio)}
                      </div>
                    </td>
                    <td className="celda-acciones">
                      <div className="acciones-contenedor">
                        <button
                          onClick={() => onEditar(producto)}
                          className="boton-editar"
                        >
                          <span className="icono-editar">✏️</span>
                          Editar
                        </button>
                        <button
                          onClick={() => onEliminar(producto)}
                          className="boton-eliminar"
                        >
                          <span className="icono-eliminar">🗑️</span>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VISTA MÓVIL */}
      <div className="productos-mobile-view mobile-only">
        {renderProductosMobile()}
      </div>

      {/* Estadísticas */}
      {!loading && productos.length > 0 && (
        <>
          {/* Estadísticas desktop */}
          <div className="estadisticas-rapidas desktop-only">
            <div className="estadistica-item">
              <span className="estadistica-label">Total productos:</span>
              <span className="estadistica-valor">{estadisticas.totalProductos}</span>
            </div>
            <div className="estadistica-item">
              <span className="estadistica-label">Con categoría:</span>
              <span className="estadistica-valor">{estadisticas.totalConCategoria}</span>
            </div>
            
            
            {busqueda || filtroActivo !== 'todos' && (
              <div className="estadistica-item">
                <span className="estadistica-label">Filtrados:</span>
                <span className="estadistica-valor">{estadisticas.totalFiltrados}</span>
              </div>
            )}
          </div>

          {/* Estadísticas móvil */}
          <div className="estadisticas-mobile mobile-only">
            <div className="estadistica-mobile-item">
              <span className="estadistica-mobile-label">Total</span>
              <span className="estadistica-mobile-valor">{estadisticas.totalProductos}</span>
            </div>
            <div className="estadistica-mobile-item">
              <span className="estadistica-mobile-label">Con cat.</span>
              <span className="estadistica-mobile-valor">{estadisticas.totalConCategoria}</span>
            </div>
            
          </div>
        </>
      )}
    </div>
  )
}

export default TablaProductos