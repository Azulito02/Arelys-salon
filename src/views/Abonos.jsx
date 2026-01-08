import { useState, useEffect } from 'react'
import { supabase } from '../database/supabase'

const Abonos = () => {
  const [abonos, setAbonos] = useState([])
  const [creditos, setCreditos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  
  const [nuevoAbono, setNuevoAbono] = useState({
    venta_credito_id: '',
    monto: 0,
    metodo_pago: 'efectivo'
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      
      // Cargar créditos activos
      const { data: creditosData, error: errorCreditos } = await supabase
        .from('ventas_credito')
        .select('*, productos(nombre)')
        .order('fecha', { ascending: false })
      
      if (errorCreditos) throw errorCreditos
      setCreditos(creditosData || [])
      
      // Cargar abonos
      const { data: abonosData, error: errorAbonos } = await supabase
        .from('abonos_credito')
        .select(`
          *,
          ventas_credito!inner (
            nombre_cliente,
            productos (nombre)
          )
        `)
        .order('fecha', { ascending: false })
      
      if (errorAbonos) throw errorAbonos
      setAbonos(abonosData || [])
      
    } catch (error) {
      console.error('Error cargando abonos:', error)
      alert('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const abrirModal = () => {
    setNuevoAbono({
      venta_credito_id: '',
      monto: 0,
      metodo_pago: 'efectivo'
    })
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
  }

  const registrarAbono = async () => {
    if (!nuevoAbono.venta_credito_id || nuevoAbono.monto <= 0) {
      alert('Selecciona un crédito y monto válido')
      return
    }

    try {
      const abonoData = {
        venta_credito_id: nuevoAbono.venta_credito_id,
        monto: parseFloat(nuevoAbono.monto),
        metodo_pago: nuevoAbono.metodo_pago
      }

      const { error } = await supabase
        .from('abonos_credito')
        .insert([abonoData])
      
      if (error) throw error
      
      alert('Abono registrado correctamente')
      cerrarModal()
      cargarDatos()
    } catch (error) {
      console.error('Error registrando abono:', error)
      alert('Error al registrar abono')
    }
  }

  const getMetodoPagoColor = (metodo) => {
    switch (metodo) {
      case 'efectivo': return 'bg-green-100 text-green-800'
      case 'tarjeta': return 'bg-blue-100 text-blue-800'
      case 'transferencia': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Abonos a Créditos</h1>
          <p className="text-gray-600">Registro de abonos a ventas a crédito</p>
        </div>
        <button
          onClick={abrirModal}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Abono
        </button>
      </div>

      {/* Tabla de abonos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Método de Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    Cargando abonos...
                  </td>
                </tr>
              ) : abonos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No hay abonos registrados
                  </td>
                </tr>
              ) : (
                abonos.map((abono) => (
                  <tr key={abono.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {abono.ventas_credito?.nombre_cliente || 'Cliente no encontrado'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {abono.ventas_credito?.productos?.nombre || 'Producto no encontrado'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${parseFloat(abono.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMetodoPagoColor(abono.metodo_pago)}`}>
                        {abono.metodo_pago.charAt(0).toUpperCase() + abono.metodo_pago.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(abono.fecha).toLocaleString('es-MX')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para nuevo abono */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Nuevo Abono
              </h3>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Crédito *
                </label>
                <select
                  value={nuevoAbono.venta_credito_id}
                  onChange={(e) => setNuevoAbono({...nuevoAbono, venta_credito_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecciona un crédito</option>
                  {creditos.map((credito) => (
                    <option key={credito.id} value={credito.id}>
                      {credito.nombre_cliente} - {credito.productos?.nombre} (${credito.total})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={nuevoAbono.monto}
                  onChange={(e) => setNuevoAbono({...nuevoAbono, monto: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Método de Pago *
                </label>
                <select
                  value={nuevoAbono.metodo_pago}
                  onChange={(e) => setNuevoAbono({...nuevoAbono, metodo_pago: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                </select>
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
                onClick={registrarAbono}
                className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700"
              >
                Registrar Abono
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Abonos