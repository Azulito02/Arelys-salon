import React from 'react'
import './TablaVentas.css'

const TablaVentas = ({ ventas, loading, onEditar, onEliminar, onImprimir, imprimiendo }) => {
  
  // Función para formatear fecha con hora Nicaragua
  const formatFechaNicaragua = (fechaISO) => {
    if (!fechaISO) return 'Fecha no disponible';
    
    const fechaUTC = new Date(fechaISO);
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

  // Función para mostrar el método de pago con iconos
  const getMetodoPagoIcon = (metodo) => {
    switch(metodo) {
      case 'efectivo': return '💰';
      case 'tarjeta': return '💳';
      case 'transferencia': return '🏦';
      case 'mixto': return '🔄';
      default: return '❓';
    }
  };

  // Función para obtener clase CSS del método de pago
  const getMetodoPagoClase = (metodo) => {
    switch(metodo) {
      case 'efectivo': return 'metodo-efectivo';
      case 'tarjeta': return 'metodo-tarjeta';
      case 'transferencia': return 'metodo-transferencia';
      case 'mixto': return 'metodo-mixto';
      default: return 'metodo-default';
    }
  };

 // ✅ FUNCIÓN CORREGIDA - CON MEJOR MANEJO DE ERRORES
const renderMetodoPagoConBanco = (venta) => {
  const metodo = venta.metodo_pago;
  const clase = getMetodoPagoClase(metodo);
  const icono = getMetodoPagoIcon(metodo);
  const texto = metodo ? metodo.charAt(0).toUpperCase() + metodo.slice(1) : 'No especificado';
  
  // Intentar obtener detalles de diferentes formas
  let detalles = venta.detalles_pago || {};
  
  // Si detalles es un string, intentar parsearlo
  if (typeof detalles === 'string') {
    try {
      detalles = JSON.parse(detalles);
    } catch (e) {
      detalles = {};
    }
  }
  
  console.log('🎯 Renderizando venta:', { 
    id: venta.id, 
    metodo, 
    detalles,
    total: venta.total 
  });
  
  // MÉTODO MIXTO
  if (metodo === 'mixto') {
    // Intentar obtener valores de diferentes fuentes
    const efectivo = parseFloat(detalles.efectivo) || 0;
    const tarjeta = parseFloat(detalles.tarjeta) || 0;
    const transferencia = parseFloat(detalles.transferencia) || 0;
    
    // Si no hay detalles, intentar dividir el total en partes iguales como fallback
    if (efectivo === 0 && tarjeta === 0 && transferencia === 0 && venta.total > 0) {
      // Mostrar solo el total sin detalles
      return (
        <div className={`metodo-pago-badge ${clase}`} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="metodo-pago-icono">{icono}</span>
            <span className="metodo-pago-texto">{texto}</span>
            <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: '600' }}>
              C${venta.total.toFixed(2)}
            </span>
          </div>
        </div>
      );
    }
    
    const total = efectivo + tarjeta + transferencia;
    const bancoTarjeta = detalles.banco_tarjeta || detalles.banco || 'Lafite';
    const bancoTransferencia = detalles.banco_transferencia || detalles.banco || 'BAC';

    return (
      <div className={`metodo-pago-badge ${clase}`} style={{ flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
          <span className="metodo-pago-icono">{icono}</span>
          <span className="metodo-pago-texto">{texto}</span>
          <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: '600' }}>
            C${(total || venta.total).toFixed(2)}
          </span>
        </div>
        
        {/* Mostrar detalles solo si existen */}
        {(efectivo > 0 || tarjeta > 0 || transferencia > 0) && (
          <div style={{ marginTop: '8px', width: '100%', paddingLeft: '8px', borderLeft: '2px solid rgba(107, 33, 168, 0.3)' }}>
            {efectivo > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span>💵 Efectivo</span>
                <span style={{ fontWeight: '600' }}>C${efectivo.toFixed(2)}</span>
              </div>
            )}
            {tarjeta > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span>
                  💳 Tarjeta 
                  {bancoTarjeta && <span className="detalle-banco-corchetes"> [{bancoTarjeta}]</span>}
                </span>
                <span style={{ fontWeight: '600' }}>C${tarjeta.toFixed(2)}</span>
              </div>
            )}
            {transferencia > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span>
                  🏦 Transferencia
                  {bancoTransferencia && <span className="detalle-banco-corchetes"> [{bancoTransferencia}]</span>}
                </span>
                <span style={{ fontWeight: '600' }}>C${transferencia.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // MÉTODO SIMPLE
  const banco = detalles.banco_tarjeta || detalles.banco || 
                (metodo === 'tarjeta' ? 'Lafite' : 
                 metodo === 'transferencia' ? 'BAC' : '');

  return (
    <div className={`metodo-pago-badge ${clase}`} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span className="metodo-pago-icono">{icono}</span>
        <span className="metodo-pago-texto">{texto}</span>
        <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: '600' }}>
          C${venta.total?.toFixed(2) || '0.00'}
        </span>
      </div>
      
      {/* BANCO ENTRE CORCHETES */}
      {banco && (metodo === 'tarjeta' || metodo === 'transferencia') && (
        <span className="metodo-pago-banco-corchetes">[{banco}]</span>
      )}
    </div>
  );
};
  
  // Renderizar vista móvil
  const renderVistaMobile = () => {
    if (loading) {
      return (
        <div className="sin-resultados-mobile">
          <div className="spinner"></div>
          <p>Cargando ventas...</p>
        </div>
      );
    }

    if (ventas.length === 0) {
      return (
        <div className="sin-resultados-mobile">
          <p>No hay ventas registradas</p>
        </div>
      );
    }

    return ventas.map((venta) => (
      <div key={venta.id} className="venta-card-mobile">
       <div className="venta-card-header">
  <div style={{ flex: 1 }}>
    <div className="venta-producto">
      {venta.item?.nombre || 'Producto no encontrado'}
      {venta.tipo_item === 'servicio' && (
        <span style={{ marginLeft: '8px', fontSize: '12px', color: '#8b5cf6' }}>
          🔹
        </span>
      )}
    </div>
    {venta.tipo_item === 'producto' && venta.item?.categoria && (
      <div style={{ fontSize: '13px', color: '#64748b' }}>
        {venta.item.categoria}
      </div>
    )}
  </div>
  <span className="venta-cantidad-badge">
    {venta.cantidad} unidades
  </span>
</div> 
        <div className="venta-details-grid">
          <div className="venta-detail-item">
            <span className="venta-detail-label">Precio Unit.</span>
            <span className="venta-detail-value">
              C${venta.precio_unitario?.toFixed(2) || '0.00'}
            </span>
          </div>
          
          <div className="venta-detail-item">
            <span className="venta-detail-label">Total</span>
            <span className="venta-detail-value total">
              C${venta.total?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>
        
        {/* Método de pago móvil - AHORA CON BANCOS REALES */}
        <div className={`venta-metodo-mobile`}>
          <span className="venta-metodo-label">Método de Pago</span>
          {renderMetodoPagoConBanco(venta)}
        </div>
        
        {/* Fecha en móvil */}
        <div className="venta-fecha-mobile">
          <div className="venta-fecha-label">Fecha de venta:</div>
          <div className="venta-fecha-valor">
            {formatFechaNicaragua(venta.fecha)}
          </div>
        </div>
        
        {/* Acciones en móvil */}
        <div className="venta-actions-mobile">
          <button
            onClick={() => onImprimir && onImprimir(venta)}
            disabled={imprimiendo}
            className="venta-action-btn imprimir"
            title="Imprimir"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir
          </button>
          <button
            onClick={() => onEditar(venta)}
            className="venta-action-btn editar"
            title="Editar"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </button>
          <button
            onClick={() => onEliminar(venta)}
            className="venta-action-btn eliminar"
            title="Eliminar"
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
    const totalVentas = ventas.length;
    const totalUnidades = ventas.reduce((sum, venta) => sum + venta.cantidad, 0);
    const totalValor = ventas.reduce((sum, venta) => sum + (venta.total || 0), 0);
    
    return { totalVentas, totalUnidades, totalValor };
  };

  const resumenMobile = calcularResumenMobile();

  return (
    <div className="tabla-ventas-container">
      <div className="tabla-ventas-card">
        {/* VISTA DESKTOP/TABLET */}
        <div className="tabla-scroll-container desktop-only">
          <table className="tabla-ventas">
            <thead>
              <tr>
                <th className="columna-producto">Producto</th>
                <th className="columna-cantidad">Cantidad</th>
                <th className="columna-fecha">Fecha</th>
                <th className="columna-metodo">Método de Pago</th>
                <th className="columna-precio">Precio</th>
                <th className="columna-total">Total</th>
                <th className="columna-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="cargando-mensaje">
                    <div className="spinner"></div>
                    Cargando ventas...
                  </td>
                </tr>
              ) : ventas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="sin-registros">
                    No hay registros de ventas
                  </td>
                </tr>
              ) : (
                ventas.map((venta) => (
                  <tr key={venta.id} className="fila-venta">
                   <td className="celda-producto">
  <div className="nombre-producto">
    {venta.item?.nombre || 'Producto no encontrado'}
    {venta.tipo_item === 'servicio' && (
      <span style={{ marginLeft: '8px', fontSize: '12px', color: '#8b5cf6' }}>
        🔹 Servicio
      </span>
    )}
  </div>
  {venta.tipo_item === 'producto' && venta.item?.categoria && (
    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
      {venta.item.categoria}
    </div>
  )}
</td>

                    <td className="celda-cantidad">
                      <span className="cantidad-venta">
                        {venta.cantidad} unidades
                      </span>
                    </td>
                    <td className="celda-fecha">
                      {formatFechaNicaragua(venta.fecha)}
                    </td>
                    <td className="celda-metodo">
                      {renderMetodoPagoConBanco(venta)}
                    </td>
                    <td className="celda-precio">
                      <div className="precio-venta">
                        C${venta.precio_unitario?.toFixed(2) || '0.00'}
                      </div>
                    </td>
                    <td className="celda-total">
                      <div className="total-venta">
                        <strong>C${venta.total?.toFixed(2) || '0.00'}</strong>
                      </div>
                    </td>
                    <td className="celda-acciones">
                      <div className="acciones-container">
                        {/* Botón de Imprimir */}
                        <button
                          onClick={() => onImprimir && onImprimir(venta)}
                          disabled={imprimiendo}
                          className="accion-btn accion-imprimir"
                          title="Imprimir ticket"
                        >
                          {imprimiendo ? (
                            <div className="spinner-mini-accion"></div>
                          ) : (
                            <svg className="accion-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                          )}
                        </button>
                        
                        {/* Botón de Editar */}
                        <button
                          onClick={() => onEditar(venta)}
                          className="accion-btn accion-editar"
                          title="Editar venta"
                        >
                          <svg className="accion-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        
                        {/* Botón de Eliminar */}
                        <button
                          onClick={() => onEliminar(venta)}
                          className="accion-btn accion-eliminar"
                          title="Eliminar venta"
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
        
        {/* VISTA MÓVIL COMPLETA */}
        <div className="tabla-mobile-view mobile-only">
          {renderVistaMobile()}
        </div>
        
        {/* RESUMEN DESKTOP */}
        {!loading && ventas.length > 0 && (
          <div className="resumen-ventas desktop-only">
            <div className="resumen-item">
              <span>Total de ventas:</span>
              <strong>{ventas.length} registros</strong>
            </div>
            <div className="resumen-item">
              <span>Unidades vendidas:</span>
              <strong>
                {ventas.reduce((sum, venta) => sum + venta.cantidad, 0)} unidades
              </strong>
            </div>
            <div className="resumen-item">
              <span>Total ventas:</span>
              <strong>
                C${ventas.reduce((sum, venta) => sum + (venta.total || 0), 0).toFixed(2)}
              </strong>
            </div>
          </div>
        )}
        
        {/* RESUMEN MÓVIL */}
        {!loading && resumenMobile.totalVentas > 0 && (
          <div className="resumen-mobile mobile-only">
            <div className="resumen-mobile-item">
              <span className="resumen-mobile-label">Ventas</span>
              <span className="resumen-mobile-value">{resumenMobile.totalVentas}</span>
            </div>
            <div className="resumen-mobile-item">
              <span className="resumen-mobile-label">Unidades</span>
              <span className="resumen-mobile-value">
                {resumenMobile.totalUnidades}
              </span>
            </div>
            <div className="resumen-mobile-item">
              <span className="resumen-mobile-label">Total</span>
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

export default TablaVentas