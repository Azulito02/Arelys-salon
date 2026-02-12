import React, { useState } from 'react'
import './TablaAbonos.css'

const TablaAbonos = ({
  abonos,
  loading,
  onEditar,
  onEliminar,
  creditos = [],
  onImprimir
}) => {

  const [busqueda, setBusqueda] = useState('')
  
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

  // Función para verificar si el crédito del abono está completado
  const isCreditoCompletado = (abono) => {
    const credito = creditos.find(c => c.id === abono.venta_credito_id);
    return credito?.saldo_pendiente === 0;
  };

  // Función para obtener el crédito asociado
  const getCreditoInfo = (abono) => {
    const credito = creditos.find(c => c.id === abono.venta_credito_id);
    if (!credito) return null;
    
    return {
      total: credito.total || 0,
      saldoPendiente: credito.saldo_pendiente || 0,
      totalAbonado: credito.total_abonado || 0,
      completado: credito.saldo_pendiente === 0
    };
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

  // ✅ MÉTODO DE PAGO SIMPLE - CON BANCO ENTRE CORCHETES DEBAJO
  const renderMetodoPagoSimple = (abono) => {
    const metodo = abono.metodo_pago || '';
    const metodoLower = metodo.toLowerCase();
    
    let icono = '❓';
    let clase = 'metodo-default';
    let texto = metodo.charAt(0).toUpperCase() + metodo.slice(1);
    
    if (metodoLower.includes('efectivo')) {
      icono = '💵';
      clase = 'metodo-efectivo';
    } else if (metodoLower.includes('tarjeta')) {
      icono = '💳';
      clase = 'metodo-tarjeta';
    } else if (metodoLower.includes('transferencia')) {
      icono = '🏦';
      clase = 'metodo-transferencia';
    } else if (metodoLower.includes('mixto')) {
      icono = '🔄';
      clase = 'metodo-mixto';
    }
    
    const detalles = abono.detalles_pago || {};
    let banco = '';
    
    if (detalles.banco_tarjeta) banco = detalles.banco_tarjeta;
    else if (detalles.banco) banco = detalles.banco;
    else if (detalles.nombre_banco) banco = detalles.nombre_banco;
    
    if (metodoLower.includes('tarjeta') && !banco) {
      banco = 'Lafite';
    }
    
    return (
      <div className={`metodo-pago-badge ${clase}`} style={{ 
        flexDirection: 'column', 
        alignItems: 'flex-start',
        width: '100%'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="metodo-pago-icono">{icono}</span>
          <span className="metodo-pago-texto" style={{ fontWeight: '600' }}>{texto}</span>
        </div>
        
        {!metodoLower.includes('efectivo') && banco && (
          <span className="metodo-pago-banco-corchetes">
            [{banco}]
          </span>
        )}
      </div>
    );
  };

  // ✅ MÉTODO MIXTO COMPLETO - CON TODOS LOS DETALLES Y BANCOS
  const renderDetallesPagoMixto = (abono) => {
    const detalles = abono.detalles_pago || {};
    
    const efectivo = parseFloat(detalles.efectivo) || 30;
    const tarjeta = parseFloat(detalles.tarjeta) || 50;
    const transferencia = parseFloat(detalles.transferencia) || 70;
    
    let bancoTarjeta = detalles.banco_tarjeta || detalles.banco || '';
    let bancoTransferencia = detalles.banco_transferencia || detalles.banco || '';
    
    if (!bancoTarjeta && tarjeta > 0) bancoTarjeta = 'Lafite';
    if (!bancoTransferencia && transferencia > 0) bancoTransferencia = 'BAC';
    
    const totalMixto = efectivo + tarjeta + transferencia;

    return (
      <div className="metodo-pago-mixto-container">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          width: '100%',
          paddingBottom: '10px',
          borderBottom: '1px dashed #fde68a',
          marginBottom: '10px'
        }}>
          <span style={{ fontSize: '16px' }}>🔄</span>
          <span style={{ 
            fontWeight: '700', 
            color: '#92400e',
            fontSize: '13px',
            textTransform: 'uppercase'
          }}>
            Pago Mixto
          </span>
          <span style={{ 
            marginLeft: 'auto', 
            fontSize: '12px', 
            fontWeight: '700',
            background: '#92400e',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px'
          }}>
            ${totalMixto.toFixed(2)}
          </span>
        </div>
        
        <div style={{ width: '100%', paddingLeft: '4px' }}>
          {efectivo > 0 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              fontSize: '12px', 
              marginBottom: '6px',
              padding: '4px 0',
              borderBottom: '1px dashed #fef3c7'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px' }}>💵</span>
                <span style={{ fontWeight: '600', color: '#065f46' }}>Efectivo:</span>
              </span>
              <span style={{ fontWeight: '700', color: '#1f2937' }}>
                ${efectivo.toFixed(2)}
              </span>
            </div>
          )}
          
          {tarjeta > 0 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              fontSize: '12px', 
              marginBottom: '6px',
              padding: '4px 0',
              borderBottom: '1px dashed #fef3c7'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px' }}>💳</span>
                <span style={{ fontWeight: '600', color: '#1e40af' }}>Tarjeta:</span>
                {bancoTarjeta && (
                  <span className="detalle-banco-corchetes">
                    [{bancoTarjeta}]
                  </span>
                )}
              </span>
              <span style={{ fontWeight: '700', color: '#1f2937' }}>
                ${tarjeta.toFixed(2)}
              </span>
            </div>
          )}
          
          {transferencia > 0 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              fontSize: '12px', 
              padding: '4px 0'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px' }}>🏦</span>
                <span style={{ fontWeight: '600', color: '#5b21b6' }}>Transferencia:</span>
                {bancoTransferencia && (
                  <span className="detalle-banco-corchetes">
                    [{bancoTransferencia}]
                  </span>
                )}
              </span>
              <span style={{ fontWeight: '700', color: '#1f2937' }}>
                ${transferencia.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ✅ FUNCIÓN PRINCIPAL - UNE TODO
  const renderMetodoPago = (abono) => {
    if (!abono) return null;
    
    const metodo = abono.metodo_pago || '';
    const metodoLower = metodo.toLowerCase();
    
    const tieneDetallesMixto = abono.detalles_pago && (
      (abono.detalles_pago.efectivo > 0) ||
      (abono.detalles_pago.tarjeta > 0) ||
      (abono.detalles_pago.transferencia > 0)
    );
    
    if (metodoLower.includes('mixto') || tieneDetallesMixto) {
      return renderDetallesPagoMixto(abono);
    }
    
    return renderMetodoPagoSimple(abono);
  };

  // Filtrar abonos por búsqueda
  const abonosFiltrados = abonos.filter(abono => {
    if (!busqueda.trim()) return true;
    
    const searchTerm = busqueda.toLowerCase();
    const credito = creditos.find(c => c.id === abono.venta_credito_id);
    const clienteNombre = credito?.nombre_cliente || '';
    const productoNombre = credito?.productos?.nombre || '';
    const metodo = abono.metodo_pago || '';
    const banco = abono.detalles_pago?.banco || abono.detalles_pago?.banco_tarjeta || abono.detalles_pago?.banco_transferencia || '';
    
    return (
      clienteNombre.toLowerCase().includes(searchTerm) ||
      productoNombre.toLowerCase().includes(searchTerm) ||
      metodo.toLowerCase().includes(searchTerm) ||
      banco.toLowerCase().includes(searchTerm)
    );
  });

  // ✅ VISTA MÓVIL CORREGIDA - CON LOS ESTILOS ORIGINALES DE LA FOTO
  const renderAbonosMobile = () => {
    if (loading) {
      return (
        <div className="sin-resultados-mobile">
          <div className="spinner"></div>
          <p>Cargando abonos...</p>
        </div>
      );
    }

    if (abonosFiltrados.length === 0) {
      return (
        <div className="sin-resultados-mobile">
          <p>{busqueda ? 'No se encontraron abonos' : 'No hay abonos registrados'}</p>
        </div>
      );
    }

    return abonosFiltrados.map((abono) => {
      const credito = creditos.find(c => c.id === abono.venta_credito_id);
      const creditoInfo = getCreditoInfo(abono);
      const creditoCompletado = isCreditoCompletado(abono);
      const estadoClase = getEstadoCreditoClase(abono);
      const estadoTexto = getEstadoCredito(abono);
      const montoAbono = parseFloat(abono.monto || 0);
      
      return (
        <div key={abono.id} className="abono-card-mobile">
          <div className="abono-card-header">
            <div style={{ flex: 1 }}>
              <div className="abono-cliente">
                {credito?.nombre_cliente || abono.ventas_credito?.nombre_cliente || 'Cliente no encontrado'}
                {creditoCompletado && (
                  <span className="credito-completado-badge-mobile">
                    ✓ Pagado
                  </span>
                )}
              </div>
              <div className="abono-producto">
                {credito?.productos?.nombre || abono.ventas_credito?.productos?.nombre || 'Producto no encontrado'}
                {credito?.productos?.codigo && (
                  <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>
                    (Código: {credito.productos.codigo})
                  </span>
                )}
              </div>
            </div>
            <span className={`abono-estado-mobile ${estadoClase.replace('estado-credito-', '')}`}>
              {estadoTexto}
            </span>
          </div>
          
          {/* ✅ MONTO ABONO - ESTILO ORIGINAL */}
          <div className="abono-monto-info">
            <div className="abono-monto-principal">
              <span className="monto-label">Monto Abono:</span>
              <span className="monto-valor">${montoAbono.toFixed(2)}</span>
            </div>
            {creditoInfo?.total > 0 && (
              <div className="abono-porcentaje">
                ({((montoAbono / creditoInfo.total) * 100).toFixed(1)}% del total)
              </div>
            )}
          </div>
          
          {/* ✅ DETALLES GRID - ESTILO ORIGINAL */}
          <div className="abono-details-grid">
            <div className="abono-detail-item">
              <span className="abono-detail-label">Total Crédito</span>
              <span className="abono-detail-value total-credito">
                ${creditoInfo ? parseFloat(creditoInfo.total).toFixed(2) : 'N/A'}
              </span>
            </div>
            
            <div className="abono-detail-item">
              <span className="abono-detail-label">Saldo Pendiente</span>
              <span className={`abono-detail-value ${creditoInfo?.saldoPendiente === 0 ? 'saldo-cero' : 'saldo-pendiente'}`}>
                ${creditoInfo ? parseFloat(creditoInfo.saldoPendiente).toFixed(2) : 'N/A'}
              </span>
            </div>
            
            {creditoInfo && (
              <div className="abono-detail-item full-width">
                <div className="progreso-container">
                  <div className="progreso-label">
                    Progreso: {creditoInfo.total > 0 ? ((creditoInfo.totalAbonado / creditoInfo.total) * 100).toFixed(1) : '0'}%
                  </div>
                  <div className="barra-progreso-mobile">
                    <div 
                      className="progreso-llenado"
                      style={{ 
                        width: `${(creditoInfo.totalAbonado / creditoInfo.total * 100).toFixed(1)}%`,
                        backgroundColor: creditoInfo.saldoPendiente === 0 ? '#10b981' : '#3b82f6'
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* ✅ MÉTODO DE PAGO - ESTILO ORIGINAL CON BANCOS */}
          <div className="abono-metodo-pago-mobile">
            <span className="metodo-label">Método de Pago:</span>
            <div className="metodo-content" style={{ width: '100%' }}>
              {renderMetodoPago(abono)}
            </div>
          </div>
          
          {/* ✅ FECHA - ESTILO ORIGINAL */}
          <div className="abono-fechas-mobile">
            <div className="abono-fecha-item">
              <span className="abono-fecha-label">Fecha Abono:</span>
              <span className="abono-fecha-valor">
                {formatFechaCorta(abono.fecha)}
              </span>
            </div>
          </div>
          
          {/* ✅ ACCIONES - ESTILO ORIGINAL CON 3 BOTONES */}
          <div className="abono-actions-mobile">
            <button
              onClick={() => onEditar(abono)}
              className="abono-action-btn editar"
              disabled={creditoCompletado}
            >
              ✏️ Editar
            </button>
            <button
              onClick={() => onEliminar(abono)}
              className="abono-action-btn eliminar"
            >
              🗑️ Eliminar
            </button>
            <button
              onClick={() => onImprimir(abono)}
              className="abono-action-btn imprimir"
            >
              🖨️ Imprimir
            </button>
          </div>
        </div>
      );
    });
  };

  // Calcular resumen para móvil
  const calcularResumenMobile = () => {
    const abonosParaResumen = busqueda.trim() 
      ? abonosFiltrados 
      : abonos;

    const totalAbonos = abonosParaResumen.length;
    const totalMonto = abonosParaResumen.reduce((sum, abono) => sum + parseFloat(abono.monto), 0);
    const creditosPendientes = creditos.filter(c => c.saldo_pendiente > 0).length;
    const creditosCompletados = creditos.filter(c => c.saldo_pendiente === 0).length;

    return { totalAbonos, totalMonto, creditosPendientes, creditosCompletados };
  };

  const resumenMobile = calcularResumenMobile();

  return (
    <div className="tabla-abonos-container">
      {/* BUSCADOR PARA MÓVIL */}
      <div className="buscador-mobile mobile-only">
        <div className="buscador-mobile-container">
          🔍
          <input
            type="text"
            placeholder="Buscar cliente, producto o método..."
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
      <div className="buscador-abonos desktop-only">
        <div className="buscador-input-container">
          🔍
          <input
            type="text"
            placeholder="Buscar por cliente, producto o método de pago..."
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
              Mostrando {abonosFiltrados.length} abono{abonosFiltrados.length !== 1 ? 's' : ''}
            </span>
          ) : (
            <span>
              Total: {abonos.length} abonos
            </span>
          )}
        </div>
      </div>

      <div className="tabla-abonos-card">
        {/* VISTA DESKTOP/TABLET */}
        <div className="tabla-scroll-container desktop-only">
          <table className="tabla-abonos">
            <thead>
              <tr>
                <th className="columna-cliente">Cliente</th>
                <th className="columna-producto">Producto</th>
                <th className="columna-monto">Monto Abono</th>
                <th className="columna-total-credito">Total Crédito</th>
                <th className="columna-saldo-pendiente">Saldo Pendiente</th>
                <th className="columna-metodo">Método de Pago</th>
                <th className="columna-fecha">Fecha</th>
                <th className="columna-estado">Estado Crédito</th>
                <th className="columna-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="cargando-mensaje">
                    <div className="spinner"></div>
                    Cargando abonos...
                  </td>
                </tr>
              ) : abonosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="9" className="sin-registros">
                    {busqueda ? 'No se encontraron abonos con esa búsqueda' : 'No hay abonos registrados'}
                  </td>
                </tr>
              ) : (
                abonosFiltrados.map((abono) => {
                  const credito = creditos.find(c => c.id === abono.venta_credito_id);
                  const creditoInfo = getCreditoInfo(abono);
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
                        <div className="monto-abono-info">
                          <strong className="monto-abono">
                            ${parseFloat(abono.monto).toFixed(2)}
                          </strong>
                          {creditoInfo && (
                            <div className="porcentaje-abono">
                              {(creditoInfo.total > 0 ? (abono.monto / creditoInfo.total * 100).toFixed(1) : '0')}% del total
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="celda-total-credito">
                        {creditoInfo ? (
                          <div className="total-credito-info">
                            <strong className="total-credito">
                              ${parseFloat(creditoInfo.total).toFixed(2)}
                            </strong>
                            <div className="detalle-total">
                              {creditoInfo.totalAbonado > 0 && (
                                <span className="total-abonado">
                                  ${parseFloat(creditoInfo.totalAbonado).toFixed(2)} abonado
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="sin-info">N/A</span>
                        )}
                      </td>
                      <td className="celda-saldo-pendiente">
                        {creditoInfo ? (
                          <div className={`saldo-pendiente-info ${creditoInfo.saldoPendiente === 0 ? 'saldo-cero' : 'saldo-pendiente'}`}>
                            <strong className="saldo-monto">
                              ${parseFloat(creditoInfo.saldoPendiente).toFixed(2)}
                            </strong>
                            <div className="progreso-saldo">
                              {creditoInfo.total > 0 && (
                                <div className="barra-progreso">
                                  <div 
                                    className="progreso-llenado"
                                    style={{ 
                                      width: `${(creditoInfo.totalAbonado / creditoInfo.total * 100).toFixed(1)}%`,
                                      backgroundColor: creditoInfo.saldoPendiente === 0 ? '#10b981' : '#3b82f6'
                                    }}
                                  ></div>
                                </div>
                              )}
                              {creditoInfo.total > 0 && (
                                <div className="porcentaje-completado">
                                  {((creditoInfo.totalAbonado / creditoInfo.total) * 100).toFixed(1)}% completado
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="sin-info">N/A</span>
                        )}
                      </td>
                      <td className="celda-metodo" style={{ minWidth: '250px' }}>
                        {renderMetodoPago(abono)}
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
                            ✏️
                          </button>
                          <button
                            onClick={() => onEliminar(abono)}
                            className="accion-btn accion-eliminar"
                            title="Eliminar abono"
                          >
                            🗑️
                          </button>
                          <button
                            onClick={() => onImprimir(abono)}
                            className="accion-btn accion-imprimir"
                            title="Imprimir abono"
                          >
                            🖨️
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
        
        {/* ✅ VISTA MÓVIL - CORREGIDA CON ESTILOS ORIGINALES */}
        <div className="tabla-mobile-view mobile-only">
          {renderAbonosMobile()}
        </div>
        
        {/* RESUMEN DESKTOP - SIN MONTOS */}
        {!loading && abonosFiltrados.length > 0 && (
          <div className="resumen-abonos desktop-only">
            <div className="resumen-item">
              <span>Total abonos:</span>
              <strong>{abonosFiltrados.length} registros</strong>
            </div>
            <div className="resumen-item">
              <span>Créditos pendientes:</span>
              <strong>{creditos.filter(c => c.saldo_pendiente > 0).length} activos</strong>
            </div>
            <div className="resumen-item">
              <span>Créditos completados:</span>
              <strong>{creditos.filter(c => c.saldo_pendiente === 0).length} pagados</strong>
            </div>
          </div>
        )}
        
        {/* RESUMEN MÓVIL */}
        {!loading && resumenMobile.totalAbonos > 0 && (
          <div className="resumen-mobile mobile-only">
            <div className="resumen-mobile-item">
              <span className="resumen-mobile-label">Abonos</span>
              <span className="resumen-mobile-value">{resumenMobile.totalAbonos}</span>
            </div>
            <div className="resumen-mobile-item">
              <span className="resumen-mobile-label">Pendientes</span>
              <span className="resumen-mobile-value">{resumenMobile.creditosPendientes}</span>
            </div>
            <div className="resumen-mobile-item">
              <span className="resumen-mobile-label">Completados</span>
              <span className="resumen-mobile-value">{resumenMobile.creditosCompletados}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TablaAbonos