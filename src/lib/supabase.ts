
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Garantir que apenas uma instância seja criada
let supabaseClient: ReturnType<typeof createClient> | null = null;

export const supabase = () => {
    if (!supabaseClient) {
        supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: true,
                storageKey: 'supabase.auth.token',
                storage: window.localStorage
            }
        });
    }
    return supabaseClient;
};
