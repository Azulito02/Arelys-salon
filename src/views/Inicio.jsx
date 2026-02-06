import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../database/supabase'
import './Inicio.css'

const Inicio = () => {
  const navigate = useNavigate()
  const [showLoader, setShowLoader] = useState(true)
  const [estadisticas, setEstadisticas] = useState({
    totalProductos: 0,
    ventasHoy: 0,
    creditosActivos: 0
  })
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(true)

  useEffect(() => {
    const loaderShown = sessionStorage.getItem("loaderShown")
    if (!loaderShown) {
      const timer = setTimeout(() => {
        setShowLoader(false)
        sessionStorage.setItem("loaderShown", "true")
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      setShowLoader(false)
    }
  }, [])

  useEffect(() => {
    cargarEstadisticas()
    
    // Actualizar cada 30 segundos para ver cambios en tiempo real
    const intervalo = setInterval(() => {
      cargarEstadisticas()
    }, 30000)
    
    return () => clearInterval(intervalo)
  }, [])

  const cargarEstadisticas = async () => {
    try {
      setLoadingEstadisticas(true)
      
      // 1. Obtener total de productos
      const { count: totalProductos, error: errorProductos } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true })
      
      if (errorProductos) throw errorProductos

      // 2. Obtener ventas del turno ACTUAL (solo ventas NO procesadas)
      const hoy = new Date()
      const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
      const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1)
      
      let totalVentasHoy = 0
      
      // 2.1 Ventas normales NO procesadas (tabla ventas - estas son las del turno actual)
      const { data: ventasHoyData, error: errorVentas } = await supabase
        .from('ventas')
        .select('total')
        .gte('fecha', inicioHoy.toISOString())
        .lt('fecha', finHoy.toISOString())
      
      if (!errorVentas && ventasHoyData) {
        totalVentasHoy += ventasHoyData.reduce((sum, venta) => 
          sum + parseFloat(venta.total || 0), 0)
      }
      
      // 2.2 Abonos NO procesados (del turno actual)
      const { data: abonosHoyData, error: errorAbonos } = await supabase
        .from('abonos_credito')
        .select('monto, procesado_en_arqueo')
        .gte('fecha', inicioHoy.toISOString())
        .lt('fecha', finHoy.toISOString())
      
      if (!errorAbonos && abonosHoyData) {
        // Sumar SOLO abonos que NO han sido procesados en arqueo
        const abonosNoProcesados = abonosHoyData
          .filter(abono => !abono.procesado_en_arqueo)
          .reduce((sum, abono) => sum + parseFloat(abono.monto || 0), 0)
        
        totalVentasHoy += abonosNoProcesados
      }
      
      // NOTA: NO sumamos de la tabla facturados porque esas ya fueron procesadas en arqueos anteriores
      // Solo mostramos lo que está pendiente para el próximo arqueo

      // 3. Obtener créditos activos (con saldo pendiente > 0)
      const { data: creditosData, error: errorCreditos } = await supabase
        .from('ventas_credito')
        .select(`
          *,
          abonos_credito(*)
        `)
      
      if (errorCreditos) throw errorCreditos
      
      // Calcular cuántos créditos tienen saldo pendiente
      const creditosConSaldo = (creditosData || []).filter(credito => {
        const total = parseFloat(credito.total) || 0
        const totalAbonado = credito.abonos_credito?.reduce((sum, abono) => 
          sum + parseFloat(abono.monto || 0), 0) || 0
        
        if (credito.saldo_pendiente !== null && credito.saldo_pendiente !== undefined) {
          return parseFloat(credito.saldo_pendiente) > 0
        } else {
          const saldoPendiente = total - totalAbonado
          return saldoPendiente > 0
        }
      })

      setEstadisticas({
        totalProductos: totalProductos || 0,
        ventasHoy: totalVentasHoy,
        creditosActivos: creditosConSaldo.length
      })
      
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
      // Mantener valores por defecto en caso de error
    } finally {
      setLoadingEstadisticas(false)
    }
  }

  const usuario = JSON.parse(localStorage.getItem('usuarioArelyz'))
  
  if (showLoader || !usuario) {
    return (
      <div className="loader-container">
        <div className="loader">
          <div className="loader-spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  const rol = usuario.rol || 'administrador'
  
  const botones = [
    {
      id: 'productos',
      label: 'Productos',
      icon: '📦',
      color: '#3b82f6',
      ruta: '/productos',
      roles: ['administrador']
    },
    {
      id: 'inventario',
      label: 'Inventario',
      icon: '📊',
      color: '#10b981',
      ruta: '/inventario',
      roles: ['administrador', 'cajero']
    },
    {
      id: 'ventas',
      label: 'Ventas',
      icon: '💰',
      color: '#f59e0b',
      ruta: '/ventas',
      roles: ['administrador', 'cajero', 'vendedor']
    },
    {
      id: 'creditos',
      label: 'Créditos',
      icon: '💳',
      color: '#8b5cf6',
      ruta: '/creditos',
      roles: ['administrador', 'cajero']
    },
    {
      id: 'abonos',
      label: 'Abonos',
      icon: '💵',
      color: '#ec4899',
      ruta: '/abonos',
      roles: ['administrador', 'cajero']
    },
    {
      id: 'gastos',
      label: 'Gastos',
      icon: '📉',
      color: '#ef4444',
      ruta: '/gastos',
      roles: ['administrador']
    },
    {
      id: 'arqueos',
      label: 'Arqueos',
      icon: '🧮',
      color: '#6366f1',
      ruta: '/arqueos',
      roles: ['administrador', 'cajero']
    }
  ]

  const botonesFiltrados = botones.filter(boton => 
    boton.roles.includes(rol.toLowerCase())
  )

  return (
    <div className="inicio-container">
      <div className="inicio-header">
        <h1 className="inicio-titulo">
          Bienvenido a <span className="marca">Arelyz Salon</span>
        </h1>
        <p className="inicio-subtitulo">
          Sistema de gestión de inventario y ventas
        </p>
        <div className="usuario-bienvenida">
          <span className="usuario-saludo">Hola, </span>
          <span className="usuario-nombre">{usuario.nombre}</span>
          <span className="usuario-rol-badge">{rol}</span>
        </div>
      </div>

      <div className="botones-grid">
        {botonesFiltrados.map((boton) => (
          <div 
            key={boton.id}
            className="boton-card"
            onClick={() => navigate(boton.ruta)}
            style={{ '--boton-color': boton.color }}
          >
            <div className="boton-icono" style={{ backgroundColor: `${boton.color}20` }}>
              <span className="icono" style={{ color: boton.color }}>
                {boton.icon}
              </span>
            </div>
            <div className="boton-contenido">
              <h3 className="boton-titulo">{boton.label}</h3>
              <p className="boton-descripcion">Gestionar {boton.label.toLowerCase()}</p>
            </div>
            <div className="boton-flecha">
              <span className="flecha-icon">→</span>
            </div>
          </div>
        ))}
      </div>

      {botonesFiltrados.length === 0 && (
        <div className="sin-acceso">
          <p>No tienes permisos para acceder a ninguna sección del sistema.</p>
          <p>Contacta al administrador.</p>
        </div>
      )}

      <div className="estadisticas-rapidas">
        <div className="estadistica-card">
          <div className="estadistica-icono">📦</div>
          <div className="estadistica-contenido">
            <p className="estadistica-valor">
              {loadingEstadisticas ? (
                <span className="cargando-estadistica">...</span>
              ) : (
                estadisticas.totalProductos
              )}
            </p>
            <p className="estadistica-label">Productos</p>
          </div>
        </div>
        
        <div className="estadistica-card">
          <div className="estadistica-icono">💳</div>
          <div className="estadistica-contenido">
            <p className="estadistica-valor">
              {loadingEstadisticas ? (
                <span className="cargando-estadistica">...</span>
              ) : (
                estadisticas.creditosActivos
              )}
            </p>
            <p className="estadistica-label">Créditos Activos</p>
          </div>
        </div>
      </div>
      
    </div>
  )
}

export default Inicio