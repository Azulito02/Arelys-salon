import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './Inicio.css' // Importar el CSS desde archivo separado

const Inicio = () => {
  const navigate = useNavigate()
  const [showLoader, setShowLoader] = useState(true)

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
    // Botones para todos los roles
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
            <p className="estadistica-valor">--</p>
            <p className="estadistica-label">Productos</p>
          </div>
        </div>
        
        <div className="estadistica-card">
          <div className="estadistica-icono">💰</div>
          <div className="estadistica-contenido">
            <p className="estadistica-valor">--</p>
            <p className="estadistica-label">Ventas Hoy</p>
          </div>
        </div>
        
        <div className="estadistica-card">
          <div className="estadistica-icono">💳</div>
          <div className="estadistica-contenido">
            <p className="estadistica-valor">--</p>
            <p className="estadistica-label">Créditos Activos</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Inicio