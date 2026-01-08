import { useState, useEffect } from 'react'
import { supabase } from '../database/supabase'

const Gastos = () => {
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  
  const [nuevoGasto, setNuevoGasto] = useState({
    descripcion: '',
    monto: ''
  })

  useEffect(() => {
    cargarGastos()
  }, [])

  const cargarGastos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('gastos')
        .select('*')
        .order('fecha', { ascending: false })
      
      if (error) throw error
      setGastos(data || [])
    } catch (error) {
      console.error('Error cargando gastos:', error)
      alert('Error al cargar gastos')
    } finally {
      setLoading(false)
    }
  }

  const abrirModal = () => {
    setNuevoGasto({ descripcion: '', monto: '' })
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
  }

  const registrarGasto = async () => {
    if (!nuevoGasto.descripcion || !nuevoGasto.monto || parseFloat(nuevoGasto.monto) <= 0) {
      alert('Completa todos los campos con valores válidos')
      return
    }

    try {
      const gastoData = {
        descripcion: nuevoGasto.descripcion,
        monto: parseFloat(nuevoGasto.monto)
      }

      const { error } = await supabase
        .from('gastos')
        .insert([gastoData])
      
      if (error) throw error
      
      alert('Gasto registrado correctamente')
      cerrarModal()
      cargarGastos()
    } catch (error) {
      console.error('Error registrando gasto:', error)
      alert('Error al registrar gasto')
    }
  }

  const eliminarGasto = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este gasto?')) return
    
    try {
      const { error } = await supabase
        .from('gastos')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      alert('Gasto eliminado correctamente')
      cargarGastos()
    } catch (error) {
      console.error('Error eliminando gasto:', error)
      alert('Error al eliminar gasto')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gastos</h1>
          <p className="text-gray-600">Registro de gastos del salón</p>
        </div>
        <button
          onClick={abrirModal}
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Gasto
        </button>
      </div>

      {/* Tabla de gastos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    Cargando gastos...
                  </td>
                </tr>
              ) : gastos.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    No hay gastos registrados
                  </td>
                </tr>
              ) : (
                gastos.map((gasto) => (
                  <tr key={gasto.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {gasto.descripcion}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-red-600 font-medium">
                        -${parseFloat(gasto.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(gasto.fecha).toLocaleString('es-MX')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => eliminarGasto(gasto.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para nuevo gasto */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Nuevo Gasto
              </h3>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción *
                </label>
                <input
                  type="text"
                  value={nuevoGasto.descripcion}
                  onChange={(e) => setNuevoGasto({...nuevoGasto, descripcion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Compra de insumos, pago de servicios..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={nuevoGasto.monto}
                  onChange={(e) => setNuevoGasto({...nuevoGasto, monto: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={cerrarModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={registrarGasto}
                className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700"
              >
                Registrar Gasto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Gastos