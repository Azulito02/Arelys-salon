import React from 'react'
import './Gastos.css'

const TablaGastos = ({ gastos, loading, onEditar, onEliminar }) => {
  
  // Función para formatear fecha con hora Nicaragua
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
    <div className="tabla-gastos-container">
      <div className="tabla-gastos-card">
        <div className="overflow-x-auto">
          <table className="tabla-gastos">
            <thead>
              <tr>
                <th className="columna-descripcion">Descripción</th>
                <th className="columna-monto">Monto</th>
                <th className="columna-fecha">Fecha</th>
                <th className="columna-fecha-simple">Fecha Simple</th>
                <th className="columna-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="cargando-mensaje">
                    <div className="spinner"></div>
                    Cargando gastos...
                  </td>
                </tr>
              ) : gastos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="sin-registros">
                    No hay gastos registrados
                  </td>
                </tr>
              ) : (
                gastos.map((gasto) => (
                  <tr key={gasto.id} className="fila-gasto">
                    <td className="celda-descripcion">
                      <div className="descripcion-gasto">
                        {gasto.descripcion}
                      </div>
                    </td>
                    <td className="celda-monto">
                      <span className="monto-negativo">
                        -${parseFloat(gasto.monto).toFixed(2)}
                      </span>
                    </td>
                    <td className="celda-fecha">
                      {formatFechaNicaragua(gasto.fecha)}
                    </td>
                    <td className="celda-fecha-simple">
                      {formatSoloFecha(gasto.fecha)}
                    </td>
                    <td className="celda-acciones">
                      <div className="acciones-container">
                        <button
                          onClick={() => onEditar(gasto)}
                          className="accion-btn accion-editar"
                          title="Editar gasto"
                        >
                          <svg className="accion-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onEliminar(gasto)}
                          className="accion-btn accion-eliminar"
                          title="Eliminar gasto"
                        >
                          <svg className="accion-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Resumen */}
        {!loading && gastos.length > 0 && (
          <div className="resumen-gastos">
            <div className="resumen-item">
              <span>Total gastos:</span>
              <strong>{gastos.length} registros</strong>
            </div>
            <div className="resumen-item">
              <span>Total monto:</span>
              <strong className="total-monto-negativo">
                -${gastos.reduce((sum, gasto) => sum + parseFloat(gasto.monto), 0).toFixed(2)}
              </strong>
            </div>
            <div className="resumen-item">
              <span>Gasto promedio:</span>
              <strong>
                ${(gastos.reduce((sum, gasto) => sum + parseFloat(gasto.monto), 0) / gastos.length).toFixed(2)}
              </strong>
            </div>
            <div className="resumen-item">
              <span>Último gasto:</span>
              <strong>
                {formatSoloFecha(gastos[0]?.fecha)}
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TablaGastos