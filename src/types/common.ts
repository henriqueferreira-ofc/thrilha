import { PostgrestError } from '@supabase/supabase-js';

// Tipo para erros genéricos
export type ErrorType = Error | PostgrestError | null;

// Tipo para funções de manipulação de erros
export type ErrorHandler = (error: ErrorType) => void;

// Tipo para respostas de API
export interface ApiResponse<T> {
  data: T | null;
  error: ErrorType;
} 