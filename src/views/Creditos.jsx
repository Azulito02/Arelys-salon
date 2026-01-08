import { useState, useEffect } from 'react'
import { supabase } from '../database/supabase'

const Creditos = () => {
  const [creditos, setCreditos] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  
  const [nuevoCredito, setNuevoCredito] = useState({
    producto_id: '',
    cantidad: 1,
    precio_unitario: 0,
    total: 0,
    nombre_cliente: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: ''
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      
      // Cargar productos
      const { data: productosData, error: errorProductos } = await supabase
        .from('productos')
        .select('*')
        .order('nombre')
      
      if (errorProductos) throw errorProductos
      setProductos(productosData || [])
      
      // Cargar ventas a crédito
      const { data: creditosData, error: errorCreditos } = await supabase
        .from('ventas_credito')
        .select(`
          *,
          productos (nombre)
        `)
        .order('fecha', { ascending: false })
      
      if (errorCreditos) throw errorCreditos
      setCreditos(creditosData || [])
      
    } catch (error) {
      console.error('Error cargando créditos:', error)
      alert('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const abrirModal = () => {
    const hoy = new Date().toISOString().split('T')[0]
    const unaSemanaDespues = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    setNuevoCredito({
      producto_id: '',
      cantidad: 1,
      precio_unitario: 0,
      total: 0,
      nombre_cliente: '',
      fecha_inicio: hoy,
      fecha_fin: unaSemanaDespues
    })
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
  }

  const calcularTotal = () => {
    const cantidad = parseInt(nuevoCredito.cantidad) || 0
    const precio = parseFloat(nuevoCredito.precio_unitario) || 0
    return cantidad * precio
  }

  const registrarCredito = async () => {
    if (!nuevoCredito.producto_id || nuevoCredito.cantidad < 1 || !nuevoCredito.nombre_cliente) {
      alert('Completa todos los campos obligatorios')
      return
    }

    try {
      const totalCalculado = calcularTotal()
      
      const creditoData = {
        producto_id: nuevoCredito.producto_id,
        cantidad: parseInt(nuevoCredito.cantidad),
        precio_unitario: parseFloat(nuevoCredito.precio_unitario),
        total: totalCalculado,
        nombre_cliente: nuevoCredito.nombre_cliente,
        fecha_inicio: nuevoCredito.fecha_inicio,
        fecha_fin: nuevoCredito.fecha_fin
      }

      const { error } = await supabase
        .from('ventas_credito')
        .insert([creditoData])
      
      if (error) throw error
      
      alert('Crédito registrado correctamente')
      cerrarModal()
      cargarDatos()
    } catch (error) {
      console.error('Error registrando crédito:', error)
      alert('Error al registrar crédito')
    }
  }

  const handleProductoChange = (productoId) => {
    const producto = productos.find(p => p.id === productoId)
    if (producto) {
      setNuevoCredito({
        ...nuevoCredito,
        producto_id: productoId,
        precio_unitario: producto.precio
      })
    }
  }

  const getEstadoCredito = (fechaFin) => {
    const hoy = new Date()
    const fin = new Date(fechaFin)
    
    if (hoy > fin) {
      return { texto: 'Vencido', color: 'bg-red-100 text-red-800' }
    } else if ((fin - hoy) / (1000 * 60 * 60 * 24) <= 3) {
      return { texto: 'Por vencer', color: 'bg-yellow-100 text-yellow-800' }
    } else {
      return { texto: 'Activo', color: 'bg-green-100 text-green-800' }
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ventas a Crédito</h1>
          <p className="text-gray-600">Registro y seguimiento de créditos</p>
        </div>
        <button
          onClick={abrirModal}
          className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Crédito
        </button>
      </div>

      {/* Tabla de créditos */}
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
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Fin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    Cargando créditos...
                  </td>
                </tr>
              ) : creditos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No hay créditos registrados
                  </td>
                </tr>
              ) : (
                creditos.map((credito) => {
                  const estado = getEstadoCredito(credito.fecha_fin)
                  return (
                    <tr key={credito.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {credito.nombre_cliente}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {credito.productos?.nombre || 'Producto no encontrado'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {credito.cantidad} x ${parseFloat(credito.precio_unitario).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${parseFloat(credito.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(credito.fecha_fin).toLocaleDateString('es-MX')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estado.color}`}>
                          {estado.texto}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para nuevo crédito */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Nueva Venta a Crédito
              </h3>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Cliente *
                </label>
                <input
                  type="text"
                  value={nuevoCredito.nombre_cliente}
                  onChange={(e) => setNuevoCredito({...nuevoCredito, nombre_cliente: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: María González"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Producto *
                </label>
                <select
                  value={nuevoCredito.producto_id}
                  onChange={(e) => handleProductoChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecciona un producto</option>
                  {productos.map((producto) => (
                    <option key={producto.id} value={producto.id}>
                      {producto.nombre} - ${producto.precio}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad *
                </label>
                <input
                  type="number"
                  min="1"
                  value={nuevoCredito.cantidad}
                  onChange={(e) => setNuevoCredito({...nuevoCredito, cantidad: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={nuevoCredito.fecha_inicio}
                    onChange={(e) => setNuevoCredito({...nuevoCredito, fecha_inicio: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Fin *
                  </label>
                  <input
                    type="date"
                    value={nuevoCredito.fecha_fin}
                    onChange={(e) => setNuevoCredito({...nuevoCredito, fecha_fin: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total a Crédito:</span>
                  <span className="text-lg font-bold text-gray-900">
                    ${calcularTotal().toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
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
                onClick={registrarCredito}
                className="px-4 py-2 bg-yellow-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-yellow-700"
              >
                Registrar Crédito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Creditos