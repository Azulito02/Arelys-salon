import React from 'react'
import './TablaAbonos.css'

const TablaAbonos = ({ 
  abonos, 
  loading, 
  onEditar, 
  onEliminar, 
  getMetodoPagoColor, 
  getMetodoPagoIcon,
  creditos = [] // Recibir créditos para verificar estado
}) => {
  
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

  // Función para verificar si el crédito del abono está completado
  const isCreditoCompletado = (abono) => {
    const credito = creditos.find(c => c.id === abono.venta_credito_id);
    return credito?.saldo_pendiente === 0;
  };

  // Función para obtener el estado del crédito
  const getEstadoCredito = (abono) => {
    const credito = creditos.find(c => c.id === abono.venta_credito_id);
    if (!credito) return 'Crédito no encontrado';
    
    if (credito.saldo_pendiente === 0) return 'Completado';
    if (!credito.fecha_fin) return 'Sin fecha de vencimiento';
    
    const hoy = new Date();
    const fin = new Date(credito.fecha_fin);
    const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const finSinHora = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate());
    
    const diferenciaMs = finSinHora.getTime() - hoySinHora.getTime();
    const diferenciaDias = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));
    
    if (diferenciaDias < 0) return 'Crédito vencido';
    if (diferenciaDias <= 3) return 'Crédito por vencer';
    return 'Crédito activo';
  };

  // Función para obtener la clase CSS según estado del crédito
  const getEstadoCreditoClase = (abono) => {
    const credito = creditos.find(c => c.id === abono.venta_credito_id);
    if (!credito) return 'estado-credito-no-encontrado';
    
    if (credito.saldo_pendiente === 0) return 'estado-credito-completado';
    if (!credito.fecha_fin) return 'estado-credito-sin-fecha';
    
    const hoy = new Date();
    const fin = new Date(credito.fecha_fin);
    const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const finSinHora = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate());
    
    const diferenciaMs = finSinHora.getTime() - hoySinHora.getTime();
    const diferenciaDias = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));
    
    if (diferenciaDias < 0) return 'estado-credito-vencido';
    if (diferenciaDias <= 3) return 'estado-credito-por-vencer';
    return 'estado-credito-activo';
  };

  return (
    <div className="tabla-abonos-container">
      <div className="tabla-abonos-card">
        <div className="overflow-x-auto">
          <table className="tabla-abonos">
            <thead>
              <tr>
                <th className="columna-cliente">Cliente</th>
                <th className="columna-producto">Producto</th>
                <th className="columna-monto">Monto</th>
                <th className="columna-metodo">Método de Pago</th>
                <th className="columna-fecha">Fecha</th>
                <th className="columna-estado">Estado Crédito</th>
                <th className="columna-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="cargando-mensaje">
                    <div className="spinner"></div>
                    Cargando abonos...
                  </td>
                </tr>
              ) : abonos.length === 0 ? (
                <tr>
                  <td colSpan="7" className="sin-registros">
                    No hay abonos registrados
                  </td>
                </tr>
              ) : (
                abonos.map((abono) => {
                  const credito = creditos.find(c => c.id === abono.venta_credito_id);
                  const creditoCompletado = isCreditoCompletado(abono);
                  
                  return (
                    <tr key={abono.id} className={`fila-abono ${creditoCompletado ? 'credito-completado' : ''}`}>
                      <td className="celda-cliente">
                        <div className="nombre-cliente">
                          {credito?.nombre_cliente || abono.ventas_credito?.nombre_cliente || 'Cliente no encontrado'}
                        </div>
                        {creditoCompletado && (
                          <div className="credito-completado-badge">
                            ✓ Crédito Pagado
                          </div>
                        )}
                      </td>
                      <td className="celda-producto">
                        <div className="nombre-producto">
                          {credito?.productos?.nombre || abono.ventas_credito?.productos?.nombre || 'Producto no encontrado'}
                        </div>
                        {credito?.productos?.codigo && (
                          <div className="codigo-producto">
                            Código: {credito.productos.codigo}
                          </div>
                        )}
                      </td>
                      <td className="celda-monto">
                        <strong>
                          ${parseFloat(abono.monto).toFixed(2)}
                        </strong>
                      </td>
                      <td className="celda-metodo">
                        <div className={`metodo-pago-badge ${getMetodoPagoColor(abono.metodo_pago)}`}>
                          <span className="metodo-pago-icono">
                            {getMetodoPagoIcon(abono.metodo_pago)}
                          </span>
                          <span className="metodo-pago-texto">
                            {abono.metodo_pago.charAt(0).toUpperCase() + abono.metodo_pago.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="celda-fecha">
                        {formatFechaNicaragua(abono.fecha)}
                      </td>
                      <td className="celda-estado">
                        <span className={`badge-estado ${getEstadoCreditoClase(abono)}`}>
                          {getEstadoCredito(abono)}
                        </span>
                      </td>
                      <td className="celda-acciones">
                        <div className="acciones-container">
                          <button
                            onClick={() => onEditar(abono)}
                            className="accion-btn accion-editar"
                            title="Editar abono"
                            disabled={creditoCompletado}
                          >
                            <svg className="accion-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onEliminar(abono)}
                            className="accion-btn accion-eliminar"
                            title="Eliminar abono"
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
        {!loading && abonos.length > 0 && (
          <div className="resumen-abonos">
            <div className="resumen-item">
              <span>Total abonos:</span>
              <strong>{abonos.length} registros</strong>
            </div>
            <div className="resumen-item">
              <span>Abonos activos:</span>
              <strong>
                {abonos.filter(a => !isCreditoCompletado(a)).length} activos
              </strong>
            </div>
            <div className="resumen-item">
              <span>Total monto:</span>
              <strong>
                ${abonos.reduce((sum, abono) => sum + parseFloat(abono.monto), 0).toFixed(2)}
              </strong>
            </div>
            <div className="resumen-item">
              <span>Clientes únicos:</span>
              <strong>
                {[...new Set(abonos.map(a => 
                  creditos.find(c => c.id === a.venta_credito_id)?.nombre_cliente
                ).filter(Boolean))].length} clientes
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TablaAbonos