// src/components/gastos/TablaGastos.jsx
import React, { useState } from 'react'
import './Gastos.css'

const TablaGastos = ({ gastos, loading, onEditar, onEliminar }) => {
  const [busqueda, setBusqueda] = useState('')
  
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

  // Función para formatear fecha corta para móvil
  const formatFechaCorta = (fechaISO) => {
    if (!fechaISO) return 'Sin fecha';
    
    const fechaUTC = new Date(fechaISO);
    const fechaNicaragua = new Date(fechaUTC.getTime() - (6 * 60 * 60 * 1000));
    
    const dia = fechaNicaragua.getDate().toString().padStart(2, '0');
    const mes = (fechaNicaragua.getMonth() + 1).toString().padStart(2, '0');
    const año = fechaNicaragua.getFullYear();
    
    return `${dia}/${mes}/${año}`;
  };

  // Filtrar gastos por búsqueda
  const gastosFiltrados = gastos.filter(gasto => {
    if (!busqueda.trim()) return true;
    
    const searchTerm = busqueda.toLowerCase();
    return (
      gasto.descripcion.toLowerCase().includes(searchTerm)
    );
  });

  // Renderizar gastos para vista móvil
  const renderGastosMobile = () => {
    if (loading) {
      return (
        <div className="sin-resultados-mobile">
          <div className="spinner"></div>
          <p>Cargando gastos...</p>
        </div>
      );
    }

    if (gastosFiltrados.length === 0) {
      return (
        <div className="sin-resultados-mobile">
          <p>{busqueda ? 'No se encontraron gastos' : 'No hay gastos registrados'}</p>
        </div>
      );
    }

    return gastosFiltrados.map((gasto) => (
      <div key={gasto.id} className="gasto-card-mobile">
        <div className="gasto-card-header">
          <div style={{ flex: 1 }}>
            <div className="gasto-descripcion">{gasto.descripcion}</div>
          </div>
          <span className="gasto-monto-mobile">
            -C${parseFloat(gasto.monto).toFixed(2)}
          </span>
        </div>
        
        <div className="gasto-details-grid">
          <div className="gasto-detail-item">
            <span className="gasto-detail-label">Fecha Registro</span>
            <span className="gasto-detail-value">
              {formatFechaCorta(gasto.fecha)}
            </span>
          </div>
          
        </div>
        
        <div className="gasto-actions-mobile">
          <button
            onClick={() => onEditar(gasto)}
            className="action-btn-mobile editar"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </button>
          <button
            onClick={() => onEliminar(gasto)}
            className="action-btn-mobile eliminar"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar
          </button>
        </div>
      </div>
    ));
  };

  // Calcular resumen para móvil
  const calcularResumenMobile = () => {
    const gastosParaResumen = busqueda.trim() 
      ? gastosFiltrados 
      : gastos;

    const totalGastos = gastosParaResumen.length;
    const totalMonto = gastosParaResumen.reduce((sum, gasto) => sum + parseFloat(gasto.monto), 0);
    const promedio = totalGastos > 0 ? totalMonto / totalGastos : 0;

    return { totalGastos, totalMonto, promedio };
  };

  const resumenMobile = calcularResumenMobile();

  return (
    <div className="tabla-gastos-container">
      {/* BUSCADOR PARA MÓVIL */}
      <div className="buscador-mobile">
        <div className="buscador-mobile-container">
          <svg className="buscador-mobile-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="buscador-mobile-input"
          />
          {busqueda && (
            <button 
              onClick={() => setBusqueda('')}
              className="buscador-mobile-limpiar"
              title="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* BUSCADOR PARA DESKTOP */}
      <div className="buscador-gastos">
        <div className="buscador-input-container">
          <svg className="buscador-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="buscador-input"
          />
          {busqueda && (
            <button 
              onClick={() => setBusqueda('')}
              className="buscador-limpiar"
              title="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>
        <div className="buscador-info">
          {busqueda ? (
            <span>
              Mostrando {gastosFiltrados.length} gasto{gastosFiltrados.length !== 1 ? 's' : ''}
            </span>
          ) : (
            <span>
              Total: {gastos.length} gastos
            </span>
          )}
        </div>
      </div>

      <div className="tabla-gastos-card">
        {/* VISTA DESKTOP/TABLET */}
        <div className="tabla-scroll-container desktop-only">
          <table className="tabla-gastos">
            <thead>
              <tr>
                <th className="columna-descripcion">Descripción</th>
                <th className="columna-monto">Monto</th>
                <th className="columna-fecha">Fecha Registro</th>
                
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
              ) : gastosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="sin-registros">
                    {busqueda ? 'No se encontraron gastos con esa búsqueda' : 'No hay gastos registrados'}
                  </td>
                </tr>
              ) : (
                gastosFiltrados.map((gasto) => (
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
        
        {/* VISTA MÓVIL */}
        <div className="tabla-mobile-view mobile-only">
          {renderGastosMobile()}
        </div>
        
        {/* RESUMEN DESKTOP */}
        {!loading && gastosFiltrados.length > 0 && (
          <div className="resumen-gastos desktop-only">
            <div className="resumen-item">
              <span>Total gastos:</span>
              <strong>{gastosFiltrados.length} registros</strong>
            </div>
            <div className="resumen-item">
              <span>Total monto:</span>
              <strong className="total-monto-negativo">
                -${gastosFiltrados.reduce((sum, gasto) => sum + parseFloat(gasto.monto), 0).toFixed(2)}
              </strong>
            </div>
            <div className="resumen-item">
              <span>Gasto promedio:</span>
              <strong>
                ${(gastosFiltrados.reduce((sum, gasto) => sum + parseFloat(gasto.monto), 0) / gastosFiltrados.length).toFixed(2)}
              </strong>
            </div>
            <div className="resumen-item">
              <span>Último gasto:</span>
              <strong>
                {formatSoloFecha(gastosFiltrados[0]?.fecha)}
              </strong>
            </div>
          </div>
        )}
        
        {/* RESUMEN MÓVIL */}
        {!loading && resumenMobile.totalGastos > 0 && (
          <div className="resumen-mobile mobile-only">
            <div className="resumen-mobile-item">
              <span className="resumen-mobile-label">Gastos</span>
              <span className="resumen-mobile-value">{resumenMobile.totalGastos}</span>
            </div>
            <div className="resumen-mobile-item">
              <span className="resumen-mobile-label">Total</span>
              <span className="resumen-mobile-value total-monto-negativo">
                -${resumenMobile.totalMonto.toFixed(2)}
              </span>
            </div>
            <div className="resumen-mobile-item">
              <span className="resumen-mobile-label">Promedio</span>
              <span className="resumen-mobile-value">
                ${resumenMobile.promedio.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TablaGastos