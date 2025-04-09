
import { Database } from '@/integrations/supabase/types';

export type Tables = Database['public']['Tables'];
export type TaskRow = Tables['tasks']['Row'];
export type ProfileRow = Tables['profiles']['Row'];

// Define custom type for task collaborators since it's not in the Database type
export interface TaskCollaboratorRow {
  id: string;
  task_id: string;
  user_id: string;
  added_at: string;
  added_by: string;
}

export interface SupabaseError {
  message: string;
  details: string;
  hint: string;
  code: string;
} 
