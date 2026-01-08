import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Encabezado from './components/Encabezado'

const RutasProtegidas = () => {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Verificar usuario en localStorage
    const usuarioStorage = JSON.parse(localStorage.getItem('usuarioArelyz'))
    setUsuario(usuarioStorage)
    setCargando(false)
    
    // Si no hay usuario y NO estamos en la página de login
    if (!usuarioStorage && location.pathname !== '/') {
      // Redirigir al login y reemplazar el historial
      navigate('/', { replace: true })
    }
  }, [location.pathname, navigate])

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!usuario) {
    // Reemplazar en el historial para evitar que vuelva atrás
    return <Navigate to="/" replace state={{ from: location }} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Encabezado />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </div>
    </div>
  )
}

export default RutasProtegidas