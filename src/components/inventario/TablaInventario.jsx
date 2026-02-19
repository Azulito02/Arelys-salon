import React, { useState } from 'react'
import './TablaInventario.css'

const TablaInventario = ({ inventario, loading, onEditar, onEliminar }) => {
  const [busqueda, setBusqueda] = useState('')

  // ✅ Función para formatear SOLO fecha (sin hora)
  const formatSoloFecha = (fechaISO) => {
    if (!fechaISO) return 'No disponible';
    
    const fechaUTC = new Date(fechaISO);
    const fechaNicaragua = new Date(fechaUTC.getTime() - (6 * 60 * 60 * 1000));
    
    const dia = fechaNicaragua.getDate().toString().padStart(2, '0');
    const mes = (fechaNicaragua.getMonth() + 1).toString().padStart(2, '0');
    const año = fechaNicaragua.getFullYear();
    
    return `${dia}/${mes}/${año}`;
  };

  
    // Función para formatear fecha COMPLETA (con hora) - SIN ajuste
    const formatFechaCompleta = (fechaISO) => {
      if (!fechaISO) return 'No disponible';
      
      const fecha = new Date(fechaISO);
      
      const dia = fecha.getDate().toString().padStart(2, '0');
      const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
      const año = fecha.getFullYear();
      
      let horas = fecha.getHours();
      const minutos = fecha.getMinutes().toString().padStart(2, '0');
      const ampm = horas >= 12 ? 'p.m.' : 'a.m.';
      
      horas = horas % 12;
      horas = horas ? horas.toString().padStart(2, '0') : '12';
      
      return `${dia}/${mes}/${año}, ${horas}:${minutos} ${ampm}`;
    };

  // ✅ FILTRAR POR BÚSQUEDA - CÓDIGO DE BARRAS
  const inventarioFiltrado = busqueda.trim() 
    ? inventario.filter(item => {
        const nombre = item.productos?.nombre?.toLowerCase() || '';
        const codigo = item.productos?.codigo?.toLowerCase() || '';
        const codigoBarras = item.productos?.codigo_barras?.toLowerCase() || '';
        const busquedaLower = busqueda.toLowerCase();
        
        return nombre.includes(busquedaLower) ||
               codigo.includes(busquedaLower) ||
               codigoBarras.includes(busquedaLower);
      })
    : inventario;

  // Renderizar vista móvil
  const renderVistaMobile = () => {
    if (loading) {
      return (
        <div className="sin-resultados-mobile">
          <div className="spinner"></div>
          <p>Cargando inventario...</p>
        </div>
      );
    }

    if (inventarioFiltrado.length === 0) {
      return (
        <div className="sin-resultados-mobile">
          <p>{busqueda ? 'No se encontraron entradas' : 'No hay entradas en el inventario'}</p>
        </div>
      );
    }

    return inventarioFiltrado.map((item) => {
      const total = (item.productos?.precio || 0) * item.entrada;
      
      return (
        <div key={item.id} className="inventario-card-mobile">
          <div className="inventario-card-header">
            <div style={{ flex: 1 }}>
              <div className="inventario-producto">
                {item.productos?.nombre || 'Producto no encontrado'}
              </div>
              {item.productos?.codigo_barras && (
                <div className="inventario-codigo-barras">
                  📟 Código: {item.productos.codigo_barras}
                </div>
              )}
              {item.productos?.codigo && !item.productos?.codigo_barras && (
                <div className="inventario-codigo">
                  Código: {item.productos.codigo}
                </div>
              )}
            </div>
            <span className="inventario-entrada-badge">
              +{item.entrada} unidades
            </span>
          </div>
          
          <div className="inventario-details-grid">
            <div className="inventario-detail-item">
              <span className="inventario-detail-label">Precio Unit.</span>
              <span className="inventario-detail-value">
                C${item.productos?.precio?.toFixed(2) || '0.00'}
              </span>
            </div>
            
            <div className="inventario-detail-item">
              <span className="inventario-detail-label">Total</span>
              <span className="inventario-detail-value total">
                C${total.toFixed(2)}
              </span>
            </div>
          </div>
          
          <div className="inventario-fechas-mobile">
            <div className="inventario-fecha-item">
              <span className="inventario-fecha-label">Registro:</span>
              <span className="inventario-fecha-valor">
                {formatSoloFecha(item.fecha)}  {/* ← SIN hora */}
              </span>
            </div>
            <div className="inventario-fecha-item">
              <span className="inventario-fecha-label">Editado:</span>
              <span className="inventario-fecha-valor">
                {item.fecha_edicion 
                  ? formatFechaCompleta(item.fecha_edicion)  
                  : 'No editado'}
              </span>
            </div>
          </div>
          
          <div className="inventario-actions-mobile">
            <button
              onClick={() => onEditar(item)}
              className="inventario-action-btn editar"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </button>
            <button
              onClick={() => onEliminar(item)}
              className="inventario-action-btn eliminar"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar
            </button>
          </div>
        </div>
      );
    });
  };

  // Calcular resumen para móvil
  const calcularResumenMobile = () => {
    const totalEntradas = inventarioFiltrado.length;
    const totalUnidades = inventarioFiltrado.reduce((sum, item) => sum + item.entrada, 0);
    const totalValor = inventarioFiltrado.reduce((sum, item) => 
      sum + ((item.productos?.precio || 0) * item.entrada), 0
    );
    const productosUnicos = [...new Set(inventarioFiltrado.map(item => item.productos?.id))].length;

    return { totalEntradas, totalUnidades, totalValor, productosUnicos };
  };

  const resumenMobile = calcularResumenMobile();

  return (
    <div className="tabla-inventario-container">
      {/* BUSCADOR PARA MÓVIL */}
      <div className="buscador-mobile mobile-only">
        <div className="buscador-mobile-container">
          <svg className="buscador-mobile-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, código o código de barras..."
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
      <div className="buscador-creditos desktop-only">
        <div className="buscador-input-container">
          <svg className="buscador-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, código o código de barras..."
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
              Mostrando {inventarioFiltrado.length} entrada{inventarioFiltrado.length !== 1 ? 's' : ''}
            </span>
          ) : (
            <span>
              Total: {inventario.length} entradas
            </span>
          )}
        </div>
      </div>

      <div className="tabla-inventario-card">
        {/* VISTA DESKTOP/TABLET */}
        <div className="tabla-scroll-container desktop-only">
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
              ) : inventarioFiltrado.length === 0 ? (
                <tr>
                  <td colSpan="7" className="sin-registros">
                    {busqueda ? 'No se encontraron entradas con esa búsqueda' : 'No hay entradas en el inventario'}
                  </td>
                </tr>
              ) : (
                inventarioFiltrado.map((item) => {
                  const total = (item.productos?.precio || 0) * item.entrada;
                  
                  return (
                    <tr key={item.id} className="fila-inventario">
                      <td className="celda-producto">
                        <div className="nombre-producto">
                          {item.productos?.nombre || 'Producto no encontrado'}
                        </div>
                        {item.productos?.codigo_barras && (
                          <div className="codigo-barras">
                            📟 {item.productos.codigo_barras}
                          </div>
                        )}
                        {item.productos?.codigo && !item.productos?.codigo_barras && (
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
                        {formatSoloFecha(item.fecha)}  {/* ← SIN hora */}
                      </td>
                      <td className="celda-fecha-edicion">
                        {item.fecha_edicion 
                          ? formatFechaCompleta(item.fecha_edicion)  
                          : 'No editado'}
                      </td>
                      <td className="celda-precio">
                        C${item.productos?.precio?.toFixed(2) || '0.00'}
                      </td>
                      <td className="celda-total">
                        <strong>
                          C${total.toFixed(2)}
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
        
        {/* VISTA MÓVIL */}
        <div className="tabla-mobile-view mobile-only">
          {renderVistaMobile()}
        </div>
        
        {/* RESUMEN DESKTOP */}
        {!loading && inventarioFiltrado.length > 0 && (
          <div className="resumen-inventario desktop-only">
            <div className="resumen-item">
              <span>Total de entradas:</span>
              <strong>{inventarioFiltrado.length} registros</strong>
            </div>
            <div className="resumen-item">
              <span>Total unidades:</span>
              <strong>
                {inventarioFiltrado.reduce((sum, item) => sum + item.entrada, 0)} unidades
              </strong>
            </div>
            <div className="resumen-item">
              <span>Valor total:</span>
              <strong>
                C${inventarioFiltrado.reduce((sum, item) => 
                  sum + ((item.productos?.precio || 0) * item.entrada), 0
                ).toFixed(2)}
              </strong>
            </div>
          </div>
        )}
        
        {/* RESUMEN MÓVIL */}
        {!loading && resumenMobile.totalEntradas > 0 && (
          <div className="resumen-mobile mobile-only">
            <div className="resumen-mobile-item">
              <span className="resumen-mobile-label">Entradas</span>
              <span className="resumen-mobile-value">{resumenMobile.totalEntradas}</span>
            </div>
            <div className="resumen-mobile-item">
              <span className="resumen-mobile-label">Valor Total</span>
              <span className="resumen-mobile-value">
                C${resumenMobile.totalValor.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TablaInventario