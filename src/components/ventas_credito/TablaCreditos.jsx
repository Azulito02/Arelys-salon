// src/components/ventas_credito/TablaCreditos.jsx
import React, { useState, useEffect } from 'react'
import './TablaCreditos.css'

const TablaCreditos = ({ 
  creditos, 
  loading, 
  onEditar, 
  onEliminar, 
  onImprimir, 
  getEstadoCredito 
}) => {
  const [creditosConSaldo, setCreditosConSaldo] = useState([])
  const [creditosAgrupados, setCreditosAgrupados] = useState({})
  const [clientesExpandidos, setClientesExpandidos] = useState({})
  const [busqueda, setBusqueda] = useState('')

  // Calcular saldo pendiente
  useEffect(() => {
    if (creditos && creditos.length > 0) {
      const creditosCalculados = creditos.map(credito => {
        const totalAbonado = credito.abonos_credito?.reduce((sum, abono) => sum + parseFloat(abono.monto), 0) || 0
        
        return {
          ...credito,
          saldo_pendiente: credito.saldo_pendiente !== undefined && credito.saldo_pendiente !== null
            ? parseFloat(credito.saldo_pendiente)
            : parseFloat(credito.total) - totalAbonado
        }
      })
      setCreditosConSaldo(creditosCalculados)
    } else {
      setCreditosConSaldo([])
    }
  }, [creditos])

  // Agrupar créditos por cliente
  useEffect(() => {
    if (creditosConSaldo.length > 0) {
      const agrupados = {}
      
      creditosConSaldo.forEach(credito => {
        const clienteNombre = credito.nombre_cliente?.toLowerCase().trim() || 'sin nombre'
        
        if (!agrupados[clienteNombre]) {
          agrupados[clienteNombre] = {
            cliente: credito.nombre_cliente || 'Sin nombre',
            creditos: [],
            totalGeneral: 0,
            saldoGeneral: 0,
            productosUnicos: new Set(),
            expandido: clientesExpandidos[clienteNombre] || false
          }
        }
        
        agrupados[clienteNombre].creditos.push(credito)
        agrupados[clienteNombre].totalGeneral += parseFloat(credito.total || 0)
        agrupados[clienteNombre].saldoGeneral += credito.saldo_pendiente || 0
        agrupados[clienteNombre].productosUnicos.add(credito.productos?.nombre || 'Sin nombre')
      })
      
      setCreditosAgrupados(agrupados)
    } else {
      setCreditosAgrupados({})
    }
  }, [creditosConSaldo, clientesExpandidos])

  // Filtrar por búsqueda
  const clientesFiltrados = Object.entries(creditosAgrupados).filter(([clave, datos]) => {
    if (!busqueda.trim()) return true
    
    const searchTerm = busqueda.toLowerCase()
    return (
      datos.cliente.toLowerCase().includes(searchTerm) ||
      Array.from(datos.productosUnicos).some(producto => 
        producto.toLowerCase().includes(searchTerm)
      )
    )
  })

  const toggleExpandirCliente = (clienteNombre) => {
    setClientesExpandidos(prev => ({
      ...prev,
      [clienteNombre]: !prev[clienteNombre]
    }))
  }

  // Función para formatear fecha con la misma lógica de hora Nicaragua
  const formatFechaNicaragua = (fechaISO) => {
    if (!fechaISO) return 'Fecha no disponible';
    
    try {
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
    } catch (e) {
      return fechaISO;
    }
  };

  // Función para formatear solo fecha (sin hora)
  const formatSoloFecha = (fechaStr) => {
    if (!fechaStr) return 'Sin fecha';
    
    try {
      const fecha = new Date(fechaStr);
      const dia = fecha.getDate().toString().padStart(2, '0');
      const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
      const año = fecha.getFullYear();
      
      return `${dia}/${mes}/${año}`;
    } catch (e) {
      return fechaStr;
    }
  };

  // Formatear fecha corta para móvil (solo fecha sin hora)
  const formatFechaCorta = (fechaISO) => {
    if (!fechaISO) return 'Sin fecha';
    
    try {
      const fechaUTC = new Date(fechaISO);
      const fechaNicaragua = new Date(fechaUTC.getTime() - (6 * 60 * 60 * 1000));
      
      const dia = fechaNicaragua.getDate().toString().padStart(2, '0');
      const mes = (fechaNicaragua.getMonth() + 1).toString().padStart(2, '0');
      const año = fechaNicaragua.getFullYear();
      
      return `${dia}/${mes}/${año}`;
    } catch (e) {
      return fechaISO;
    }
  };

  // ✅ VERIFICAR QUE onImprimir EXISTE ANTES DE USARLO
  const handleImprimir = (credito, e) => {
    if (e) e.stopPropagation();
    
    if (onImprimir && typeof onImprimir === 'function') {
      onImprimir(credito);
    } else {
      console.error('❌ Función onImprimir no está definida');
      alert('Error: La función de impresión no está disponible');
    }
  };

  // Renderizar créditos para vista móvil
  const renderCreditosMobile = () => {
    if (loading) {
      return (
        <div className="sin-resultados-mobile">
          <div className="spinner"></div>
          <p>Cargando créditos...</p>
        </div>
      );
    }

    // Para móvil, mostrar todos los créditos individualmente (sin agrupar)
    const creditosParaMostrar = busqueda.trim() 
      ? creditosConSaldo.filter(credito => 
          credito.nombre_cliente?.toLowerCase().includes(busqueda.toLowerCase()) ||
          credito.productos?.nombre?.toLowerCase().includes(busqueda.toLowerCase())
        )
      : creditosConSaldo;

    if (creditosParaMostrar.length === 0) {
      return (
        <div className="sin-resultados-mobile">
          <p>{busqueda ? 'No se encontraron créditos' : 'No hay créditos registrados'}</p>
        </div>
      );
    }

    return creditosParaMostrar.map((credito) => {
      const estado = getEstadoCredito ? getEstadoCredito(credito) : { texto: 'Activo', clase: 'estado-activo' };
      
      return (
        <div key={credito.id} className="credito-card">
          <div className="credito-card-header">
            <div style={{ flex: 1 }}>
              <div className="credito-cliente">{credito.nombre_cliente || 'Cliente'}</div>
              <div className="credito-producto">
                {credito.productos?.nombre || 'Producto no encontrado'}
                {credito.productos?.codigo && (
                  <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>
                    (Código: {credito.productos.codigo})
                  </span>
                )}
              </div>
            </div>
            <span className={`credito-estado-mobile ${estado.clase?.replace('estado-', '') || 'activo'}`}>
              {estado.texto || 'Activo'}
            </span>
          </div>
          
          <div className="credito-details-grid">
            <div className="credito-detail-item">
              <span className="credito-detail-label">Cantidad</span>
              <span className="credito-detail-value">
                {credito.cantidad || 0} unidades
              </span>
            </div>
            
            <div className="credito-detail-item">
              <span className="credito-detail-label">Precio Unit.</span>
              <span className="credito-detail-value">
                C${parseFloat(credito.precio_unitario || 0).toFixed(2)}
              </span>
            </div>
            
            <div className="credito-detail-item">
              <span className="credito-detail-label">Total</span>
              <span className="credito-detail-value total">
                C${parseFloat(credito.total || 0).toFixed(2)}
              </span>
            </div>
            
            <div className="credito-detail-item">
              <span className="credito-detail-label">Saldo Pendiente</span>
              <span className="credito-detail-value saldo">
                C${(credito.saldo_pendiente || 0).toFixed(2)}
              </span>
            </div>
          </div>
          
          {/* Fechas claramente separadas */}
          <div className="credito-fechas-mobile">
            <div className="fecha-item">
              <span className="fecha-label">Registro:</span>
              <span className="fecha-valor">
                {formatFechaCorta(credito.fecha)}
              </span>
            </div>
            <div className="fecha-item">
              <span className="fecha-label">Vence:</span>
              <span className="fecha-valor">
                {formatSoloFecha(credito.fecha_fin)}
              </span>
            </div>
          </div>
          
          <div className="credito-actions-mobile">
            <button
              onClick={() => onEditar && onEditar(credito)}
              className="action-btn-mobile editar"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </button>
            <button
              onClick={() => onEliminar && onEliminar(credito)}
              className="action-btn-mobile eliminar"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar
            </button>
            {/* 🖨️ BOTÓN DE IMPRIMIR PARA MÓVIL */}
            <button
              onClick={(e) => handleImprimir(credito, e)}
              className="action-btn-mobile imprimir"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir
            </button>
          </div>
        </div>
      );
    });
  };

  // Calcular resumen para móvil
  const calcularResumenMobile = () => {
    const creditosParaResumen = busqueda.trim() 
      ? creditosConSaldo.filter(credito => 
          credito.nombre_cliente?.toLowerCase().includes(busqueda.toLowerCase()) ||
          credito.productos?.nombre?.toLowerCase().includes(busqueda.toLowerCase())
        )
      : creditosConSaldo;

    const totalCreditos = creditosParaResumen.length;
    const totalMonto = creditosParaResumen.reduce((sum, credito) => sum + parseFloat(credito.total || 0), 0);
    const totalSaldo = creditosParaResumen.reduce((sum, credito) => sum + (credito.saldo_pendiente || 0), 0);
    const totalClientes = [...new Set(creditosParaResumen.map(c => c.nombre_cliente).filter(Boolean))].length;

    return { totalCreditos, totalMonto, totalSaldo, totalClientes };
  };

  const resumenMobile = calcularResumenMobile();

  return (
    <div className="tabla-creditos-container">
      {/* BUSCADOR PARA MÓVIL */}
      <div className="buscador-mobile">
        <div className="buscador-mobile-container">
          <svg className="buscador-mobile-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar cliente o producto..."
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
      <div className="buscador-creditos">
        <div className="buscador-input-container">
          <svg className="buscador-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por cliente o producto..."
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
              Mostrando {clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? 's' : ''}
            </span>
          ) : (
            <span>
              Total: {Object.keys(creditosAgrupados).length} clientes
            </span>
          )}
        </div>
      </div>

      <div className="tabla-creditos-card">
        {/* VISTA DESKTOP/TABLET */}
        <div className="tabla-scroll-container desktop-only">
          <table className="tabla-creditos">
            <thead>
              <tr>
                <th className="columna-cliente">Cliente</th>
                <th className="columna-producto">Producto</th>
                <th className="columna-cantidad">Cantidad</th>
                <th className="columna-precio">Precio Unit.</th>
                <th className="columna-total">Total</th>
                <th className="columna-saldo">Saldo Pendiente</th>
                <th className="columna-fecha">Fecha Registro</th>
                <th className="columna-fecha-fin">Fecha Fin</th>
                <th className="columna-estado">Estado</th>
                <th className="columna-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="cargando-mensaje">
                    <div className="spinner"></div>
                    Cargando créditos...
                  </td>
                </tr>
              ) : clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="10" className="sin-registros">
                    {busqueda ? 'No se encontraron créditos con esa búsqueda' : 'No hay créditos registrados'}
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map(([clave, datos]) => {
                  const expandido = datos.expandido
                  const productosLista = Array.from(datos.productosUnicos).join(', ')
                  
                  return (
                    <React.Fragment key={clave}>
                      {/* Fila del cliente (resumen) */}
                      <tr 
                        className="fila-cliente-resumen"
                        onClick={() => toggleExpandirCliente(clave)}
                        style={{ cursor: 'pointer', backgroundColor: '#f8fafc' }}
                      >
                        <td className="celda-cliente">
                          <div className="nombre-cliente-resumen">
                            <span className="expandir-icono">
                              {expandido ? '▼' : '▶'}
                            </span>
                            <strong>{datos.cliente}</strong>
                            <span className="badge-cantidad-cliente">
                              {datos.creditos.length} crédito{datos.creditos.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </td>
                        <td className="celda-producto" colSpan="2">
                          <span className="productos-resumen" title={productosLista}>
                            {productosLista.length > 50 ? productosLista.substring(0, 50) + '...' : productosLista}
                          </span>
                        </td>
                        <td className="celda-total">
                          <strong>C${(datos.totalGeneral || 0).toFixed(2)}</strong>
                        </td>
                        <td className="celda-saldo">
                          <span className={`badge-saldo ${datos.saldoGeneral > 0 ? 'pendiente' : 'pagado'}`}>
                            C${(datos.saldoGeneral || 0).toFixed(2)}
                          </span>
                        </td>
                        <td colSpan="5">
                          <span className="texto-expandir">
                            {expandido ? 'Ocultar detalles' : 'Ver detalles'}
                          </span>
                        </td>
                      </tr>
                      
                      {/* Filas detalladas del cliente (si está expandido) */}
                      {expandido && datos.creditos.map((credito) => {
                        const estado = getEstadoCredito ? getEstadoCredito(credito) : { texto: 'Activo', clase: 'estado-activo' };
                        
                        return (
                          <tr key={credito.id} className="fila-credito-detalle">
                            <td className="celda-cliente-detalle">
                              <div className="nombre-cliente-detalle">
                                └─ {credito.nombre_cliente || 'Cliente'}
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
                                {credito.cantidad || 0} unidades
                              </span>
                            </td>
                            <td className="celda-precio">
                              C${parseFloat(credito.precio_unitario || 0).toFixed(2)}
                            </td>
                            <td className="celda-total">
                              <strong>
                                C${parseFloat(credito.total || 0).toFixed(2)}
                              </strong>
                            </td>
                            <td className="celda-saldo">
                              <span className={`badge-saldo ${(credito.saldo_pendiente || 0) > 0 ? 'pendiente' : 'pagado'}`}>
                                C${(credito.saldo_pendiente || 0).toFixed(2)}
                              </span>
                            </td>
                            <td className="celda-fecha">
                              {formatFechaNicaragua(credito.fecha)}
                            </td>
                            <td className="celda-fecha-fin">
                              {formatSoloFecha(credito.fecha_fin)}
                            </td>
                            <td className="celda-estado">
                              <span className={`badge-estado ${estado.clase || 'estado-activo'}`}>
                                {estado.texto || 'Activo'}
                              </span>
                            </td>
                            <td className="celda-acciones">
                              <div className="acciones-container">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onEditar && onEditar(credito)
                                  }}
                                  className="accion-btn accion-editar"
                                  title="Editar crédito"
                                >
                                  <svg className="accion-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onEliminar && onEliminar(credito)
                                  }}
                                  className="accion-btn accion-eliminar"
                                  title="Eliminar crédito"
                                >
                                  <svg className="accion-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                                {/* 🖨️ BOTÓN DE IMPRIMIR PARA DESKTOP */}
                                <button
                                  onClick={(e) => handleImprimir(credito, e)}
                                  className="accion-btn accion-imprimir"
                                  title="Imprimir ticket"
                                >
                                  <svg className="accion-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </React.Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* VISTA MÓVIL */}
        <div className="tabla-mobile-view mobile-only">
          {renderCreditosMobile()}
        </div>
        
        {/* RESUMEN DESKTOP */}
        {!loading && clientesFiltrados.length > 0 && (
          <div className="resumen-creditos desktop-only">
            <div className="resumen-item">
              <span>Clientes:</span>
              <strong>{clientesFiltrados.length}</strong>
            </div>
            <div className="resumen-item">
              <span>Total créditos:</span>
              <strong>
                {clientesFiltrados.reduce((sum, [_, datos]) => sum + datos.creditos.length, 0)}
              </strong>
            </div>
            <div className="resumen-item">
              <span>Monto total:</span>
              <strong>
                ${clientesFiltrados.reduce((sum, [_, datos]) => sum + (datos.totalGeneral || 0), 0).toFixed(2)}
              </strong>
            </div>
            <div className="resumen-item">
              <span>Saldo total:</span>
              <strong className="saldo-total-pendiente">
                ${clientesFiltrados.reduce((sum, [_, datos]) => sum + (datos.saldoGeneral || 0), 0).toFixed(2)}
              </strong>
            </div>
          </div>
        )}
        
        {/* RESUMEN MÓVIL */}
        {!loading && resumenMobile.totalCreditos > 0 && (
          <div className="resumen-mobile mobile-only">
            <div className="resumen-mobile-item">
              <span className="resumen-mobile-label">Créditos</span>
              <span className="resumen-mobile-value">{resumenMobile.totalCreditos}</span>
            </div>
            <div className="resumen-mobile-item">
              <span className="resumen-mobile-label">Saldo Pendiente</span>
              <span className="resumen-mobile-value saldo-total-pendiente">
                C${resumenMobile.totalSaldo.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TablaCreditos