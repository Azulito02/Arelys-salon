import { useState, useEffect } from 'react'
import { supabase } from '../database/supabase'

const Arqueos = () => {
  const [arqueos, setArqueos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  
  const [nuevoArqueo, setNuevoArqueo] = useState({
    total_ventas: 0,
    total_credito: 0,
    total_efectivo: 0,
    total_gastos: 0,
    efectivo_en_caja: 0
  })

  useEffect(() => {
    cargarArqueos()
  }, [])

  const cargarArqueos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('arqueos')
        .select('*')
        .order('fecha', { ascending: false })
      
      if (error) throw error
      setArqueos(data || [])
    } catch (error) {
      console.error('Error cargando arqueos:', error)
      alert('Error al cargar arqueos')
    } finally {
      setLoading(false)
    }
  }

  const abrirModal = async () => {
    try {
      // Calcular valores automáticos
      const hoy = new Date().toISOString().split('T')[0]
      
      // Ventas de hoy
      const { data: ventasHoy } = await supabase
        .from('ventas')
        .select('total')
        .gte('fecha', `${hoy}T00:00:00`)
        .lte('fecha', `${hoy}T23:59:59`)
      
      const totalVentas = ventasHoy?.reduce((sum, venta) => sum + venta.total, 0) || 0
      
      // Créditos de hoy
      const { data: creditosHoy } = await supabase
        .from('ventas_credito')
        .select('total')
        .gte('fecha', `${hoy}T00:00:00`)
        .lte('fecha', `${hoy}T23:59:59`)
      
      const totalCredito = creditosHoy?.reduce((sum, credito) => sum + credito.total, 0) || 0
      
      // Efectivo en facturados de hoy
      const { data: efectivoHoy } = await supabase
        .from('facturados')
        .select('total')
        .eq('metodo_pago', 'efectivo')
        .gte('fecha', `${hoy}T00:00:00`)
        .lte('fecha', `${hoy}T23:59:59`)
      
      const totalEfectivo = efectivoHoy?.reduce((sum, facturado) => sum + facturado.total, 0) || 0
      
      // Gastos de hoy
      const { data: gastosHoy } = await supabase
        .from('gastos')
        .select('monto')
        .gte('fecha', `${hoy}T00:00:00`)
        .lte('fecha', `${hoy}T23:59:59`)
      
      const totalGastos = gastosHoy?.reduce((sum, gasto) => sum + gasto.monto, 0) || 0
      
      // Efectivo en caja
      const efectivoCaja = totalEfectivo - totalGastos
      
      setNuevoArqueo({
        total_ventas: totalVentas,
        total_credito: totalCredito,
        total_efectivo: totalEfectivo,
        total_gastos: totalGastos,
        efectivo_en_caja: efectivoCaja > 0 ? efectivoCaja : 0
      })
      
      setModalAbierto(true)
    } catch (error) {
      console.error('Error calculando arqueo:', error)
      alert('Error al calcular valores automáticos')
    }
  }

  const cerrarModal = () => {
    setModalAbierto(false)
  }

  const registrarArqueo = async () => {
    try {
      const arqueoData = {
        total_ventas: parseFloat(nuevoArqueo.total_ventas) || 0,
        total_credito: parseFloat(nuevoArqueo.total_credito) || 0,
        total_efectivo: parseFloat(nuevoArqueo.total_efectivo) || 0,
        total_gastos: parseFloat(nuevoArqueo.total_gastos) || 0,
        efectivo_en_caja: parseFloat(nuevoArqueo.efectivo_en_caja) || 0
      }

      const { error } = await supabase
        .from('arqueos')
        .insert([arqueoData])
      
      if (error) throw error
      
      alert('Arqueo registrado correctamente')
      cerrarModal()
      cargarArqueos()
    } catch (error) {
      console.error('Error registrando arqueo:', error)
      alert('Error al registrar arqueo')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Arqueos de Caja</h1>
          <p className="text-gray-600">Cierre diario y control de efectivo</p>
        </div>
        <button
          onClick={abrirModal}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Nuevo Arqueo
        </button>
      </div>

      {/* Tabla de arqueos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Ventas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Crédito
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Efectivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Gastos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Efectivo en Caja
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    Cargando arqueos...
                  </td>
                </tr>
              ) : arqueos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No hay arqueos registrados
                  </td>
                </tr>
              ) : (
                arqueos.map((arqueo) => (
                  <tr key={arqueo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(arqueo.fecha).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ${parseFloat(arqueo.total_ventas).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                      ${parseFloat(arqueo.total_credito).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      ${parseFloat(arqueo.total_efectivo).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      -${parseFloat(arqueo.total_gastos).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${arqueo.efectivo_en_caja > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        ${parseFloat(arqueo.efectivo_en_caja).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para nuevo arqueo */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Nuevo Arqueo de Caja
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            
            <div className="px-6 py-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Ventas:</span>
                <span className="font-medium text-green-600">
                  ${parseFloat(nuevoArqueo.total_ventas).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Crédito:</span>
                <span className="font-medium text-yellow-600">
                  ${parseFloat(nuevoArqueo.total_credito).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Efectivo:</span>
                <span className="font-medium text-blue-600">
                  ${parseFloat(nuevoArqueo.total_efectivo).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Gastos:</span>
                <span className="font-medium text-red-600">
                  -${parseFloat(nuevoArqueo.total_gastos).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
              
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Efectivo en Caja:</span>
                  <span className="text-lg font-bold text-gray-900">
                    ${parseFloat(nuevoArqueo.efectivo_en_caja).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Efectivo real contado:
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={nuevoArqueo.efectivo_en_caja}
                  onChange={(e) => setNuevoArqueo({...nuevoArqueo, efectivo_en_caja: e.target.value})}
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
                onClick={registrarArqueo}
                className="px-4 py-2 bg-purple-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-purple-700"
              >
                Registrar Arqueo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Arqueos