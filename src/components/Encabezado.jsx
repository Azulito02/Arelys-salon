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
  
  const usuario = JSON.parse(localStorage.getItem('usuarioArelyz'))
  
  if (!usuario) return null
  
  // Detectar cambio de tamaño de pantalla
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
  
  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuAbierto && menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAbierto(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuAbierto])
  
  // Cerrar menú al cambiar de ruta
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

  // Definir las rutas disponibles según el rol
  const rutas = [
    {
      id: 'inicio',
      label: '🏠 Inicio',
      ruta: '/inicio',
      roles: ['administrador', 'cajero', 'vendedor']
    },
    {
      id: 'productos',
      label: '📦 Productos',
      ruta: '/productos',
      roles: ['administrador']
    },
    {
      id: 'inventario',
      label: '📊 Inventario',
      ruta: '/inventario',
      roles: ['administrador', 'cajero']
    },
    {
      id: 'ventas',
      label: '💰 Ventas',
      ruta: '/ventas',
      roles: ['administrador', 'cajero', 'vendedor']
    },
    {
      id: 'creditos',
      label: '💳 Créditos',
      ruta: '/creditos',
      roles: ['administrador', 'cajero']
    },
    {
      id: 'abonos',
      label: '💵 Abonos',
      ruta: '/abonos',
      roles: ['administrador', 'cajero']
    },
    {
      id: 'gastos',
      label: '📉 Gastos',
      ruta: '/gastos',
      roles: ['administrador']
    },
    {
      id: 'arqueos',
      label: '🧮 Arqueos',
      ruta: '/arqueos',
      roles: ['administrador', 'cajero']
    }
  ]

  // Filtrar rutas según el rol del usuario
  const rutasFiltradas = rutas.filter(ruta => 
    ruta.roles.includes(usuario.rol?.toLowerCase() || 'administrador')
  )

  // Calcular cuántos botones caben según el ancho de pantalla
  const calcularBotonesVisibles = () => {
    if (esMovil) return []
    
    if (anchoPantalla >= 1400) return rutasFiltradas.slice(0, 5) // Pantallas muy grandes
    if (anchoPantalla >= 1200) return rutasFiltradas.slice(0, 4) // Pantallas grandes
    if (anchoPantalla >= 1025) return rutasFiltradas.slice(0, 3) // Pantallas medianas
    
    return rutasFiltradas.slice(0, 2) // Por defecto
  }
  
  const rutasParaMostrar = calcularBotonesVisibles()

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
        
        {/* Menú de escritorio (solo para pantallas grandes) */}
        {!esMovil && (
          <div className="encabezado-menu-desktop">
            <div className="rutas-menu">
              {rutasParaMostrar.map((ruta) => (
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
              
              {/* Botón "Más" si hay más rutas disponibles */}
              {rutasFiltradas.length > rutasParaMostrar.length && (
                <button
                  className="ruta-btn mas-btn"
                  onClick={() => setMenuAbierto(true)}
                  title="Más opciones"
                >
                  <span className="ruta-icono">⋯</span>
                  <span className="ruta-texto">Más</span>
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
        
        {/* Menú hamburguesa para móvil/tablet */}
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
      
      {/* Menú lateral móvil y menú "Más" para escritorio */}
      {menuAbierto && (
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
                  title="Cerrar menú"
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
                  onClick={() => navigate(ruta.ruta)}
                >
                  <span className="menu-ruta-icono">
                    {ruta.label.split(' ')[0]}
                  </span>
                  <span className="menu-ruta-texto">
                    {ruta.label.split(' ').slice(1).join(' ')}
                  </span>
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