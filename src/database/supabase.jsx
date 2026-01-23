// Archivo: src/database/supabase.js
import { createClient } from '@supabase/supabase-js'

// USAR LOS NUEVOS NOMBRES
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

// Verificar que las variables existan
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Variables de Supabase no configuradas')
  console.log('URL presente:', !!supabaseUrl)
  console.log('Key presente:', !!supabaseKey)
  
  // Solo en desarrollo, mostrar más detalles
  if (import.meta.env.DEV) {
    console.log('URL completa:', supabaseUrl)
    console.log('Key primeros 10 chars:', supabaseKey?.substring(0, 10) + '...')
  }
}

// Crear el cliente
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Para debugging en desarrollo
if (import.meta.env.DEV) {
  console.log('✅ Supabase configurado')
  console.log('URL:', supabaseUrl.substring(0, 30) + '...')
}