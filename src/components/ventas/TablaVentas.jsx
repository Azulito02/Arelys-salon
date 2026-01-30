import React from 'react'
import './TablaVentas.css'

const TablaVentas = ({ ventas, loading, onEditar, onEliminar, onImprimir, imprimiendo }) => {
  
  // Nueva función de formato que RESTA 6 horas (como en TablaInventario)
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

  // Función para mostrar detalles del método de pago
  const getDetallesPago = (venta) => {
    if (venta.metodo_pago === 'efectivo') {
      return `Efectivo: $${venta.efectivo?.toFixed(2) || '0.00'}`;
    }
    if (venta.metodo_pago === 'tarjeta') {
      return `Tarjeta: $${venta.tarjeta?.toFixed(2) || '0.00'} (${venta.banco || 'Sin banco'})`;
    }
    if (venta.metodo_pago === 'transferencia') {
      return `Transferencia: $${venta.transferencia?.toFixed(2) || '0.00'} (${venta.banco || 'Sin banco'})`;
    }
    if (venta.metodo_pago === 'mixto') {
      const partes = [];
      if (venta.efectivo > 0) partes.push(`Efectivo: $${venta.efectivo?.toFixed(2)}`);
      if (venta.tarjeta > 0) partes.push(`Tarjeta: $${venta.tarjeta?.toFixed(2)}`);
      if (venta.transferencia > 0) partes.push(`Transferencia: $${venta.transferencia?.toFixed(2)}`);
      return partes.join(' | ');
    }
    return 'Sin método de pago';
  };

  return (
    <div className="tabla-ventas-container">
      <div className="tabla-ventas-card">
        <div className="overflow-x-auto">
          <table className="tabla-ventas">
            <thead>
              <tr>
                <th className="columna-producto">Producto</th>
                <th className="columna-cantidad">Cantidad</th>
                <th className="columna-fecha">Fecha</th>
                <th className="columna-pago">Método de Pago</th>
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
                ventas.map((venta) => {
                  return (
                    <tr key={venta.id} className="fila-venta">
                      <td className="celda-producto">
                        <div className="nombre-producto">
                          {venta.productos?.nombre || 'Producto no encontrado'}
                        </div>
                        {venta.productos?.categoria && (
                          <div className="categoria-producto">
                            {venta.productos.categoria}
                          </div>
                        )}
                      </td>
                      <td className="celda-cantidad">
                        <span className="badge-venta">
                          {venta.cantidad} unidades
                        </span>
                      </td>
                      <td className="celda-fecha">
                        {formatFechaNicaragua(venta.fecha)}
                      </td>
                      <td className="celda-pago">
                        <div className="metodo-pago-container">
                          <div className="metodo-pago-icono">
                            {getMetodoPagoIcon(venta.metodo_pago)}
                          </div>
                          <div className="metodo-pago-detalles">
                            <div className="metodo-pago-tipo">
                              {venta.metodo_pago ? venta.metodo_pago.charAt(0).toUpperCase() + venta.metodo_pago.slice(1) : 'No especificado'}
                            </div>
                            <div className="metodo-pago-info">
                              {getDetallesPago(venta)}
                            </div>
                            {venta.banco && venta.metodo_pago !== 'efectivo' && (
                              <div className="metodo-pago-banco">
                                Banco: {venta.banco}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="celda-precio">
                        ${venta.precio_unitario?.toFixed(2) || '0.00'}
                      </td>
                      <td className="celda-total">
                        <strong>
                          ${venta.total?.toFixed(2) || '0.00'}
                        </strong>
                      </td>
                      <td className="celda-acciones">
                        <div className="acciones-container">
                          {/* Botón de Imprimir */}
                          <button
                            onClick={() => onImprimir(venta)}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Resumen */}
        {!loading && ventas.length > 0 && (
          <div className="resumen-ventas-tabla">
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
              <span>Ventas en efectivo:</span>
              <strong>
                ${ventas
                  .filter(v => v.metodo_pago === 'efectivo' || v.metodo_pago === 'mixto')
                  .reduce((sum, venta) => sum + (venta.efectivo || 0), 0)
                  .toFixed(2)}
              </strong>
            </div>
            <div className="resumen-item">
              <span>Ventas con tarjeta:</span>
              <strong>
                ${ventas
                  .filter(v => v.metodo_pago === 'tarjeta' || v.metodo_pago === 'mixto')
                  .reduce((sum, venta) => sum + (venta.tarjeta || 0), 0)
                  .toFixed(2)}
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TablaVentas