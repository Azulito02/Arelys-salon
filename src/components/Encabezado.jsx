import { useNavigate } from 'react-router-dom'
import './Encabezado.css'

const Encabezado = () => {
  const navigate = useNavigate()
  
  const usuario = JSON.parse(localStorage.getItem('usuarioArelyz'))
  
  if (!usuario) return null
  
  const salir = () => {
    localStorage.removeItem('usuarioArelyz')
    navigate('/')
  }

  return (
    <nav className="encabezado">
      <div className="encabezado-contenedor">
        <div 
          className="encabezado-logo" 
          onClick={() => navigate('/inicio')}
          style={{ cursor: 'pointer' }}
        >
          💇 Arelyz Salon
        </div>
        
        <div className="encabezado-menu">
          <div className="usuario-info">
            <span className="usuario-rol">Rol:</span>
            <span className="usuario-nombre">{usuario.rol}</span>
          </div>
          
          <button 
            onClick={salir} 
            className="boton-salir"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Encabezado