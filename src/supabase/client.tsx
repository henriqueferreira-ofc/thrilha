import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and anon key
// Use a simpler approach to avoid TypeScript errors with import.meta
let supabaseUrl = 'https://yieihrvcbshzmxieflsv.supabase.co';
let supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZWlocnZjYnNoem14aWVmbHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTg3NjAwMDAsImV4cCI6MjAxNDMzNjAwMH0.REPLACE_WITH_YOUR_KEY';

// Try to use environment variables if available
try {
  // @ts-expect-error - Vite specific, import.meta.env requires special typing that we're bypassing
  if (import.meta.env.VITE_SUPABASE_URL) {
    // @ts-expect-error - Accessing dynamically added Vite environment variable
    supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  }
  // @ts-expect-error - Vite specific, import.meta.env requires special typing that we're bypassing
  if (import.meta.env.VITE_SUPABASE_ANON_KEY) {
    // @ts-expect-error - Accessing dynamically added Vite environment variable
    supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  }
} catch (e) {
  console.warn('Could not access environment variables:', e);
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});

// Log configuration in development mode
try {
  // @ts-expect-error - Vite specific, import.meta.env.DEV is not typed in standard TypeScript
  if (import.meta.env.DEV) {
    console.log('Supabase URL:', supabaseUrl);
    // Don't log the full key for security, just check if it exists
    console.log('Supabase Key exists:', !!supabaseAnonKey);
    console.log('Supabase Key format valid:', supabaseAnonKey.startsWith('eyJ'));
  }
} catch (e) {
  // Do nothing in production
} 