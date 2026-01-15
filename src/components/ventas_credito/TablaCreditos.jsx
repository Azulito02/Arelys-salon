// src/components/ventas_credito/TablaCreditos.jsx
import React from 'react'
import './TablaCreditos.css'

const TablaCreditos = ({ creditos, loading, onEditar, onEliminar, getEstadoCredito }) => {
  
  // Función para formatear fecha con la misma lógica de hora Nicaragua
  const formatFechaNicaragua = (fechaISO) => {
    if (!fechaISO) return 'Fecha no disponible';
    
    const fechaUTC = new Date(fechaISO);
    // RESTAR 6 horas para convertir UTC a Nicaragua (Juigalpa)
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
  };

  // Función para formatear solo fecha (sin hora)
  const formatSoloFecha = (fechaStr) => {
    if (!fechaStr) return 'Sin fecha';
    
    const fecha = new Date(fechaStr);
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const año = fecha.getFullYear();
    
    return `${dia}/${mes}/${año}`;
  };

  return (
    <div className="tabla-creditos-container">
      <div className="tabla-creditos-card">
        <div className="overflow-x-auto">
          <table className="tabla-creditos">
            <thead>
              <tr>
                <th className="columna-cliente">Cliente</th>
                <th className="columna-producto">Producto</th>
                <th className="columna-cantidad">Cantidad</th>
                <th className="columna-precio">Precio Unit.</th>
                <th className="columna-total">Total</th>
                <th className="columna-fecha">Fecha Registro</th>
                <th className="columna-fecha-fin">Fecha Fin</th>
                <th className="columna-estado">Estado</th>
                <th className="columna-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="cargando-mensaje">
                    <div className="spinner"></div>
                    Cargando créditos...
                  </td>
                </tr>
              ) : creditos.length === 0 ? (
                <tr>
                  <td colSpan="9" className="sin-registros">
                    No hay créditos registrados
                  </td>
                </tr>
              ) : (
                creditos.map((credito) => {
                  const estado = getEstadoCredito(credito.fecha_fin);
                  
                  return (
                    <tr key={credito.id} className="fila-credito">
                      <td className="celda-cliente">
                        <div className="nombre-cliente">
                          {credito.nombre_cliente}
                        </div>
                      </td>
                      <td className="celda-producto">
                        <div className="nombre-producto">
                          {credito.productos?.nombre || 'Producto no encontrado'}
                        </div>
                        {credito.productos?.codigo && (
                          <div className="codigo-producto">
                            Código: {credito.productos.codigo}
                          </div>
                        )}
                      </td>
                      <td className="celda-cantidad">
                        <span className="badge-cantidad">
                          {credito.cantidad} unidades
                        </span>
                      </td>
                      <td className="celda-precio">
                        ${parseFloat(credito.precio_unitario).toFixed(2)}
                      </td>
                      <td className="celda-total">
                        <strong>
                          ${parseFloat(credito.total).toFixed(2)}
                        </strong>
                      </td>
                      <td className="celda-fecha">
                        {formatFechaNicaragua(credito.fecha)}
                      </td>
                      <td className="celda-fecha-fin">
                        {formatSoloFecha(credito.fecha_fin)}
                      </td>
                      <td className="celda-estado">
                        <span className={`badge-estado ${estado.clase}`}>
                          {estado.texto}
                        </span>
                      </td>
                      <td className="celda-acciones">
                        <div className="acciones-container">
                          <button
                            onClick={() => onEditar(credito)}
                            className="accion-btn accion-editar"
                            title="Editar crédito"
                          >
                            <svg className="accion-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onEliminar(credito)}
                            className="accion-btn accion-eliminar"
                            title="Eliminar crédito"
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
        {!loading && creditos.length > 0 && (
          <div className="resumen-creditos">
            <div className="resumen-item">
              <span>Total créditos:</span>
              <strong>{creditos.length} registros</strong>
            </div>
            <div className="resumen-item">
              <span>Total monto:</span>
              <strong>
                ${creditos.reduce((sum, credito) => sum + parseFloat(credito.total), 0).toFixed(2)}
              </strong>
            </div>
            <div className="resumen-item">
              <span>Clientes únicos:</span>
              <strong>
                {[...new Set(creditos.map(c => c.nombre_cliente))].length} clientes
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TablaCreditos
