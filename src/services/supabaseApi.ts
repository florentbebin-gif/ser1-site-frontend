import { supabase } from '../supabaseClient'

type AdminPayload = Record<string, unknown>

export async function callAdmin(action: string, payload: AdminPayload = {}) {
  console.log(`[callAdmin] Calling action: ${action}`, payload)
  
  try {
    const { data, error } = await supabase.functions.invoke('admin', {
      body: {
        action,
        ...payload,
      },
    })

    if (error) {
      console.error(`[callAdmin] Error for action '${action}':`, error)
      throw new Error(error.message || 'Admin request failed')
    }

    console.log(`[callAdmin] Success for action '${action}':`, data)
    return data
  } catch (e) {
    console.error(`[callAdmin] Exception for action '${action}':`, e)
    throw e
  }
}
