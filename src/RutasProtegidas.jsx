// En tu archivo RutasProtegidas.jsx
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Encabezado from './components/Encabezado'

const RutasProtegidas = ({ onLogout, isAuthenticated }) => {
  const [cargando, setCargando] = useState(true)
  const location = useLocation()

  useEffect(() => {
    // Simular tiempo de carga
    const timer = setTimeout(() => {
      setCargando(false)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [])

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Usar isAuthenticated de las props en lugar de verificar localStorage
  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Encabezado onLogout={onLogout} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </div>
    </div>
  )
}

export default RutasProtegidas