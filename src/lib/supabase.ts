
// Este arquivo está sendo mantido para evitar quebrar imports existentes
// Mas estamos usando o cliente do arquivo src/supabase/client.ts

import { supabase } from '../supabase/client';

export { supabase };

// Adicionamos esta função por compatibilidade com código existente
export function getSupabaseClient() {
  return supabase;
}
