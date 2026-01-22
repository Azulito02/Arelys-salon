import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../database/supabase'
import './Login.css'

const Login = ({ onLogin }) => {  // Añade onLogin como prop
  const [credenciales, setCredenciales] = useState({
    usuario: '',
    contrasena: ''
  })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)

    try {
      // Buscar usuario en la tabla usuarios
      const { data: usuarios, error: errorUsuarios } = await supabase
        .from('usuarios')
        .select('*')
        .eq('nombre', credenciales.usuario)
        .single()

      if (errorUsuarios || !usuarios) {
        setError('Usuario o contraseña incorrectos')
        setCargando(false)
        return
      }

      // Verificar contraseña
      if (usuarios.contrasena === credenciales.contrasena) {
        // Guardar usuario en localStorage
        localStorage.setItem('usuarioArelyz', JSON.stringify({
          id: usuarios.id,
          nombre: usuarios.nombre,
          rol: usuarios.rol || 'administrador'
        }))

        // Llamar a onLogin para actualizar el estado global
        if (onLogin) {
          onLogin()
        }
        
        // Redirigir a inicio con replace para limpiar historial
        navigate('/inicio', { replace: true })
      } else {
        setError('Usuario o contraseña incorrectos')
      }
    } catch (error) {
      console.error('Error en login:', error)
      setError('Error al iniciar sesión')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Arelyz Salon</h1>
          <p className="login-subtitle">Sistema de Inventario</p>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="usuario" className="form-label">
              Usuario
            </label>
            <input
              id="usuario"
              type="text"
              value={credenciales.usuario}
              onChange={(e) => setCredenciales({...credenciales, usuario: e.target.value})}
              className="form-input"
              placeholder="Ingresa tu usuario"
              required
              autoComplete="username"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="contrasena" className="form-label">
              Contraseña
            </label>
            <input
              id="contrasena"
              type="password"
              value={credenciales.contrasena}
              onChange={(e) => setCredenciales({...credenciales, contrasena: e.target.value})}
              className="form-input"
              placeholder="Ingresa tu contraseña"
              required
              autoComplete="current-password"
            />
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            className="login-button"
            disabled={cargando}
          >
            {cargando ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
        
        <div className="login-footer">
          <p className="footer-text">Sistema de gestión de inventario y ventas</p>
        </div>
      </div>
    </div>
  )
}

export default Login