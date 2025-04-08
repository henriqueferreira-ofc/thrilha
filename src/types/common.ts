
import { PostgrestError } from '@supabase/supabase-js';
import { Json } from '@/integrations/supabase/types';

// Tipo para erros genéricos
export type ErrorType = Error | PostgrestError | unknown;

// Tipo para funções de manipulação de erros
export type ErrorHandler = (error: ErrorType) => void;

// Tipo para respostas de API
export interface ApiResponse<T> {
  data: T | null;
  error: ErrorType;
}

// Tipo para preferências do usuário que é compatível com Json
export interface UserPreferences {
  darkMode: boolean;
  compactMode: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  taskReminders: boolean;
  [key: string]: boolean | string | number | null | undefined | Json;
}
