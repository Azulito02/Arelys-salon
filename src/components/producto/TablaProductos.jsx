import './TablaProductos.css'

const TablaProductos = ({ productos, loading, onEditar, onEliminar }) => {
  return (
    <div className="tabla-contenedor">
      <div className="tabla-scroll">
        <table className="tabla-productos">
          <thead>
            <tr>
              <th className="columna-nombre">Nombre</th>
              <th className="columna-categoria">Categoría</th>
              <th className="columna-descripcion">Descripción</th>
              <th className="columna-precio">Precio</th>
              <th className="columna-acciones">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="tabla-cargando">
                  <div className="spinner"></div>
                  <span>Cargando productos...</span>
                </td>
              </tr>
            ) : productos.length === 0 ? (
              <tr>
                <td colSpan="5" className="tabla-vacia">
                  No hay productos registrados
                </td>
              </tr>
            ) : (
              productos.map((producto) => (
                <tr key={producto.id} className="fila-producto">
                  <td className="celda-nombre">
                    <div className="producto-nombre">{producto.nombre}</div>
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
                      ${parseFloat(producto.precio).toLocaleString('es-MX', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                      })}
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
  )
}

export default TablaProductos