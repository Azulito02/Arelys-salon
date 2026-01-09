import React from 'react'
import './TablaInventario.css'

const TablaInventario = ({ inventario, loading, onEditar, onEliminar }) => {
  
  // Función para debuggear
  const debugFecha = (fechaISO, label) => {
    if (!fechaISO) return 'N/A';
    
    const fecha = new Date(fechaISO);
    console.log(`=== DEBUG ${label} ===`);
    console.log('Fecha ISO:', fechaISO);
    console.log('Fecha objeto:', fecha);
    console.log('UTC Hours:', fecha.getUTCHours(), 'UTC Minutes:', fecha.getUTCMinutes());
    console.log('Local Hours:', fecha.getHours(), 'Local Minutes:', fecha.getMinutes());
    
    const conTimeZone = fecha.toLocaleString('es-MX', {
      timeZone: 'America/Managua',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    console.log('Con timeZone Managua:', conTimeZone);
    return conTimeZone;
  };

  return (
    <div className="tabla-inventario-container">
      <div className="tabla-inventario-card">
        <div className="overflow-x-auto">
          <table className="tabla-inventario">
            <thead>
              <tr>
                <th className="columna-producto">Producto</th>
                <th className="columna-cantidad">Cantidad</th>
                <th className="columna-fecha">Fecha de Entrada</th>
                <th className="columna-fecha-edicion">Última Edición</th>
                <th className="columna-precio">Precio Unitario</th>
                <th className="columna-total">Total</th>
                <th className="columna-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="cargando-mensaje">
                    <div className="spinner"></div>
                    Cargando inventario...
                  </td>
                </tr>
              ) : inventario.length === 0 ? (
                <tr>
                  <td colSpan="7" className="sin-registros">
                    No hay registros de inventario
                  </td>
                </tr>
              ) : (
                inventario.map((item) => {
                  // Debug cada registro
                  console.log('=== REGISTRO ===');
                  console.log('ID:', item.id);
                  debugFecha(item.fecha, 'FECHA ENTRADA');
                  debugFecha(item.fecha_edicion, 'FECHA EDICION');
                  
                  return (
                  <tr key={item.id} className="fila-inventario">
                    <td className="celda-producto">
                      <div className="nombre-producto">
                        {item.productos?.nombre || 'Producto no encontrado'}
                      </div>
                      {item.productos?.codigo && (
                        <div className="codigo-producto">
                          Código: {item.productos.codigo}
                        </div>
                      )}
                    </td>
                    <td className="celda-cantidad">
                      <span className="badge-entrada">
                        +{item.entrada} unidades
                      </span>
                    </td>
                    <td className="celda-fecha">
                      {(() => {
                        if (!item.fecha) return 'Sin fecha';
                        
                        const fechaUTC = new Date(item.fecha);
                        // RESTAR 6 horas para convertir UTC a Nicaragua
                        const fechaNicaragua = new Date(fechaUTC.getTime() - (6 * 60 * 60 * 1000));
                        
                        const dia = fechaNicaragua.getDate().toString().padStart(2, '0');
                        const mes = (fechaNicaragua.getMonth() + 1).toString().padStart(2, '0');
                        const año = fechaNicaragua.getFullYear();
                        
                        let horas = fechaNicaragua.getHours();
                        const minutos = fechaNicaragua.getMinutes().toString().padStart(2, '0');
                        const ampm = horas >= 12 ? 'p.m.' : 'a.m.';
                        
                        horas = horas % 12;
                        horas = horas ? horas.toString().padStart(2, '0') : '12';
                        
                        return `${dia}/${mes}/${año}, ${horas}:${minutos} ${ampm}`;
                      })()}
                    </td>
                    <td className="celda-fecha-edicion">
                      {item.fecha_edicion 
                        ? debugFecha(item.fecha_edicion, 'EDICION')
                        : 'No editado'}
                    </td>
                    <td className="celda-precio">
                      ${item.productos?.precio?.toFixed(2) || '0.00'}
                    </td>
                    <td className="celda-total">
                      <strong>
                        ${((item.productos?.precio || 0) * item.entrada).toFixed(2)}
                      </strong>
                    </td>
                    <td className="celda-acciones">
                      <div className="acciones-container">
                        <button
                          onClick={() => onEditar(item)}
                          className="accion-btn accion-editar"
                          title="Editar entrada"
                        >
                          <svg className="accion-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onEliminar(item)}
                          className="accion-btn accion-eliminar"
                          title="Eliminar entrada"
                        >
                          <svg className="accion-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Resumen */}
        {!loading && inventario.length > 0 && (
          <div className="resumen-inventario">
            <div className="resumen-item">
              <span>Total de entradas:</span>
              <strong>{inventario.length} registros</strong>
            </div>
            <div className="resumen-item">
              <span>Total unidades:</span>
              <strong>
                {inventario.reduce((sum, item) => sum + item.entrada, 0)} unidades
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TablaInventario