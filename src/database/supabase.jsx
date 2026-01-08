
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rnqeedtehzhlxpvljhjp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucWVlZHRlaHpobHhwdmxqaGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NjEwMzYsImV4cCI6MjA4MzIzNzAzNn0.AQhWvrDMiPLYbiR4GaiBic_nlLpZuvYOZoUwal48zlU' 

export const supabase = createClient(supabaseUrl, supabaseAnonKey)