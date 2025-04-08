import { Database } from '@/integrations/supabase/types';

export type Tables = Database['public']['Tables'];
export type TaskRow = Tables['tasks']['Row'];
export type ProfileRow = Tables['profiles']['Row'];

export interface SupabaseError {
  message: string;
  details: string;
  hint: string;
  code: string;
} 