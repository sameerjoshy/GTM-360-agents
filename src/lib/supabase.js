import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://uffuxawgzmqogzljjzbg.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Run an agent via Supabase Edge Function
export async function runAgent(functionName, payload) {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: payload,
  })
  if (error) throw error
  return data
}
