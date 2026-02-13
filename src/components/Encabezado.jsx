import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './Encabezado.css'

const Encabezado = ({ onLogout }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [esMovil, setEsMovil] = useState(window.innerWidth <= 1024)
  const [anchoPantalla, setAnchoPantalla] = useState(window.innerWidth)
  const menuRef = useRef(null)
  const masBtnRef = useRef(null)
  
  const usuario = JSON.parse(localStorage.getItem('usuarioArelyz'))
  
  if (!usuario) return null
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setAnchoPantalla(width)
      setEsMovil(width <= 1024)
      if (width > 1024) {
        setMenuAbierto(false)
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuAbierto && 
          menuRef.current && 
          !menuRef.current.contains(e.target) &&
          masBtnRef.current && 
          !masBtnRef.current.contains(e.target)) {
        setMenuAbierto(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuAbierto])
  
  useEffect(() => {
    setMenuAbierto(false)
  }, [location.pathname])
  
  const salir = () => {
    localStorage.removeItem('usuarioArelyz')
    if (onLogout) {
      onLogout()
    }
    navigate('/')
  }

  // Rutas ordenadas por prioridad
  const rutas = [
    {
      id: 'inicio',
      label: '🏠 Inicio',
      ruta: '/inicio',
      roles: ['administrador', 'cajero', 'vendedor'],
      prioridad: 1
    },
    {
      id: 'ventas',
      label: '💰 Ventas',
      ruta: '/ventas',
      roles: ['administrador', 'cajero', 'vendedor'],
      prioridad: 2
    },
    {
      id: 'creditos',
      label: '💳 Créditos',
      ruta: '/creditos',
      roles: ['administrador', 'cajero'],
      prioridad: 3
    },
    {
      id: 'inventario',
      label: '📊 Inventario',
      ruta: '/inventario',
      roles: ['administrador', 'cajero'],
      prioridad: 4
    },
    {
      id: 'productos',
      label: '📦 Productos',
      ruta: '/productos',
      roles: ['administrador'],
      prioridad: 5
    },
    {
      id: 'abonos',
      label: '💵 Abonos',
      ruta: '/abonos',
      roles: ['administrador', 'cajero'],
      prioridad: 6
    },
    {
      id: 'gastos',
      label: '📉 Gastos',
      ruta: '/gastos',
      roles: ['administrador'],
      prioridad: 7
    },
    {
      id: 'arqueos',
      label: '🧮 Arqueos',
      ruta: '/arqueos',
      roles: ['administrador', 'cajero'],
      prioridad: 8
    },
    {
      id: 'reportes',
      label: '📊 Reportes',
      ruta: '/reportes',
      roles: ['administrador', 'cajero'],
      prioridad: 9
    }
  ]

  // Filtrar rutas según el rol
  const rutasFiltradas = rutas
    .filter(ruta => ruta.roles.includes(usuario.rol?.toLowerCase() || 'administrador'))
    .sort((a, b) => a.prioridad - b.prioridad)

  // Calcular cuántos botones caben según el ancho
  const calcularBotonesVisibles = () => {
    if (esMovil) return []
    
    if (anchoPantalla >= 1600) return 6
    if (anchoPantalla >= 1400) return 5
    if (anchoPantalla >= 1200) return 4
    if (anchoPantalla >= 1025) return 3
    return 2
  }
  
  const cantidadVisibles = calcularBotonesVisibles()
  
  // Separar rutas en principales y el resto
  const rutasPrincipales = rutasFiltradas.slice(0, cantidadVisibles)
  const rutasRestantes = rutasFiltradas.slice(cantidadVisibles)

  return (
    <nav className="encabezado">
      <div className="encabezado-contenedor">
        {/* Logo */}
        <div 
          className="encabezado-logo" 
          onClick={() => navigate('/inicio')}
        >
          <span className="logo-icono">💇</span>
          <span className="logo-texto">Arelyz Salon</span>
        </div>
        
        {/* Menú de escritorio */}
        {!esMovil && (
          <div className="encabezado-menu-desktop">
            <div className="rutas-menu">
              {/* Rutas principales */}
              {rutasPrincipales.map((ruta) => (
                <button
                  key={ruta.id}
                  className={`ruta-btn ${location.pathname === ruta.ruta ? 'activa' : ''}`}
                  onClick={() => navigate(ruta.ruta)}
                  title={ruta.label}
                >
                  <span className="ruta-icono">{ruta.label.split(' ')[0]}</span>
                  <span className="ruta-texto">{ruta.label.split(' ').slice(1).join(' ')}</span>
                </button>
              ))}
              
              {/* Botón "Más" con las rutas restantes */}
              {rutasRestantes.length > 0 && (
                <button
                  ref={masBtnRef}
                  className={`ruta-btn mas-btn ${menuAbierto ? 'activo' : ''}`}
                  onClick={() => setMenuAbierto(!menuAbierto)}
                  title="Más opciones"
                >
                  <span className="ruta-icono">⋯</span>
                  <span className="ruta-texto">Más</span>
                  {rutasRestantes.length > 0 && (
                    <span className="badge-cantidad">{rutasRestantes.length}</span>
                  )}
                </button>
              )}
            </div>
            
            <div className="usuario-info">
              <div className="usuario-datos">
                <div className="usuario-nombre-display">
                  {usuario.nombre?.split(' ')[0] || 'Usuario'}
                </div>
                <div className="usuario-rol-display">
                  <span className="rol-valor">{usuario.rol || 'Administrador'}</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={salir} 
              className="boton-salir"
              title="Cerrar sesión"
            >
              Salir
            </button>
          </div>
        )}
        
        {/* Menú hamburguesa para móvil */}
        {esMovil && (
          <div className="encabezado-menu-movil" ref={menuRef}>
            <div 
              className="menu-hamburguesa-btn"
              onClick={() => setMenuAbierto(!menuAbierto)}
              title="Menú"
            >
              <div className={`hamburguesa-linea ${menuAbierto ? 'abierto' : ''}`}></div>
              <div className={`hamburguesa-linea ${menuAbierto ? 'abierto' : ''}`}></div>
              <div className={`hamburguesa-linea ${menuAbierto ? 'abierto' : ''}`}></div>
            </div>
          </div>
        )}
      </div>
      
      {/* Menú "Más" para escritorio */}
      {!esMovil && menuAbierto && rutasRestantes.length > 0 && (
        <div className="menu-mas-overlay" onClick={() => setMenuAbierto(false)}>
          <div className="menu-mas-contenido" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <div className="menu-mas-header">
              <h4>Más opciones ({rutasRestantes.length})</h4>
              <button 
                className="menu-mas-cerrar"
                onClick={() => setMenuAbierto(false)}
              >
                ✕
              </button>
            </div>
            <div className="menu-mas-rutas">
              {rutasRestantes.map((ruta) => (
                <button
                  key={ruta.id}
                  className={`menu-mas-ruta-btn ${location.pathname === ruta.ruta ? 'activa' : ''}`}
                  onClick={() => {
                    navigate(ruta.ruta)
                    setMenuAbierto(false)
                  }}
                >
                  <span className="menu-mas-ruta-icono">{ruta.label.split(' ')[0]}</span>
                  <span className="menu-mas-ruta-texto">{ruta.label.split(' ').slice(1).join(' ')}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Menú lateral móvil */}
      {esMovil && menuAbierto && (
        <div className="menu-lateral-overlay">
          <div className="menu-lateral-contenido" ref={menuRef}>
            <div className="menu-lateral-header">
              <div className="menu-usuario-info">
                <div className="menu-usuario-avatar">
                  {usuario.nombre?.charAt(0) || 'U'}
                </div>
                <div className="menu-usuario-datos">
                  <div className="menu-usuario-nombre">
                    {usuario.nombre || 'Usuario'}
                  </div>
                  <div className="menu-usuario-rol">
                    <span className="menu-rol-badge">{usuario.rol || 'Administrador'}</span>
                  </div>
                </div>
                <button 
                  className="menu-cerrar-btn"
                  onClick={() => setMenuAbierto(false)}
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="menu-lateral-rutas">
              {rutasFiltradas.map((ruta) => (
                <button
                  key={ruta.id}
                  className={`menu-ruta-btn ${location.pathname === ruta.ruta ? 'activa' : ''}`}
                  onClick={() => {
                    navigate(ruta.ruta)
                    setMenuAbierto(false)
                  }}
                >
                  <span className="menu-ruta-icono">{ruta.label.split(' ')[0]}</span>
                  <span className="menu-ruta-texto">{ruta.label.split(' ').slice(1).join(' ')}</span>
                </button>
              ))}
            </div>
            
            <div className="menu-lateral-footer">
              <button 
                onClick={salir} 
                className="menu-boton-salir"
              >
                🚪 Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Encabezado