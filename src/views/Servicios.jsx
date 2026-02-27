// src/views/Servicios.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../database/supabase'
import '../views/Servicios.css'

const Servicios = () => {
  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [servicioEditando, setServicioEditando] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  
  // Formulario simple
  const [formData, setFormData] = useState({
    nombre: '',
    precio: ''
  })

  useEffect(() => {
    cargarServicios()
  }, [])

  const cargarServicios = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('servicios')
        .select('*')
        .order('nombre', { ascending: true })

      if (error) throw error
      setServicios(data || [])
    } catch (error) {
      console.error('Error cargando servicios:', error)
      alert('Error al cargar servicios')
    } finally {
      setLoading(false)
    }
  }

  const serviciosFiltrados = servicios.filter(s => {
    if (!busqueda.trim()) return true
    return s.nombre.toLowerCase().includes(busqueda.toLowerCase())
  })

  const abrirModal = (servicio = null) => {
    if (servicio) {
      setServicioEditando(servicio)
      setFormData({
        nombre: servicio.nombre || '',
        precio: servicio.precio?.toString() || ''
      })
    } else {
      setServicioEditando(null)
      setFormData({ nombre: '', precio: '' })
    }
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setServicioEditando(null)
    setFormData({ nombre: '', precio: '' })
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const guardarServicio = async () => {
    if (!formData.nombre.trim()) {
      alert('El nombre del servicio es obligatorio')
      return
    }

    if (!formData.precio || parseFloat(formData.precio) <= 0) {
      alert('Ingresa un precio válido')
      return
    }

    try {
      setLoading(true)
      
      const servicioData = {
        nombre: formData.nombre.trim(),
        precio: parseFloat(formData.precio)
      }

      let error
      
      if (servicioEditando) {
        // Actualizar
        const { error: updateError } = await supabase
          .from('servicios')
          .update(servicioData)
          .eq('id', servicioEditando.id)
        error = updateError
      } else {
        // Crear nuevo
        const { error: insertError } = await supabase
          .from('servicios')
          .insert([servicioData])
        error = insertError
      }

      if (error) throw error

      await cargarServicios()
      cerrarModal()
    } catch (error) {
      console.error('Error guardando servicio:', error)
      alert('Error al guardar el servicio')
    } finally {
      setLoading(false)
    }
  }

  const eliminarServicio = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este servicio?')) return

    try {
      setLoading(true)
      const { error } = await supabase
        .from('servicios')
        .delete()
        .eq('id', id)

      if (error) throw error
      await cargarServicios()
    } catch (error) {
      console.error('Error eliminando servicio:', error)
      alert('Error al eliminar el servicio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="servicios-container">
      <div className="servicios-header">
        <div>
          <h1 className="servicios-titulo">Servicios</h1>
          <p className="servicios-subtitulo">Catálogo de servicios (sin inventario)</p>
        </div>
        
        <div className="header-buttons">
          <button
            onClick={() => abrirModal()}
            className="btn-agregar"
          >
            + Nuevo Servicio
          </button>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="buscador-servicios">
        <div className="buscador-container">
          <input
            type="text"
            placeholder="Buscar servicio por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="buscador-input"
          />
          {busqueda && (
            <button 
              onClick={() => setBusqueda('')}
              className="buscador-limpiar"
            >
              ✕
            </button>
          )}
        </div>
        <div className="buscador-info">
          {serviciosFiltrados.length} servicio{serviciosFiltrados.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* TABLA DE SERVICIOS */}
      <div className="servicios-card">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Cargando servicios...</p>
          </div>
        ) : serviciosFiltrados.length === 0 ? (
          <div className="sin-datos">
            <p>{busqueda ? 'No se encontraron servicios' : 'No hay servicios registrados'}</p>
          </div>
        ) : (
          <div className="tabla-scroll">
            <table className="tabla-servicios">
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Precio</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {serviciosFiltrados.map((servicio) => (
                  <tr key={servicio.id}>
                    <td className="col-nombre">{servicio.nombre}</td>
                    <td className="col-precio">C${servicio.precio.toFixed(2)}</td>
                    <td className="col-acciones">
                      <button
                        onClick={() => abrirModal(servicio)}
                        className="btn-accion editar"
                        title="Editar servicio"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => eliminarServicio(servicio.id)}
                        className="btn-accion eliminar"
                        title="Eliminar servicio"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL PARA AGREGAR/EDITAR */}
      {modalAbierto && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-titulo">
                {servicioEditando ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h3>
              <button onClick={cerrarModal} className="modal-cerrar">×</button>
            </div>

            <div className="modal-body">
              <div className="form-grupo">
                <label className="form-label">Nombre del Servicio *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ej: Corte de cabello, Manicure, etc."
                  autoFocus
                />
              </div>

              <div className="form-grupo">
                <label className="form-label">Precio *</label>
                <div className="precio-input-container">
                  <span className="precio-prefijo">C$</span>
                  <input
                    type="number"
                    name="precio"
                    value={formData.precio}
                    onChange={handleChange}
                    className="form-input precio-input"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={cerrarModal} className="btn btn-secondary">
                Cancelar
              </button>
              <button onClick={guardarServicio} className="btn btn-primary">
                {servicioEditando ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Servicios