
/**
 * Utility functions for auth-related operations
 */

/**
 * Clears all authentication data from localStorage, sessionStorage, and cookies
 */
export const clearAuthData = () => {
  localStorage.removeItem('supabase.auth.token');
  localStorage.removeItem('supabase.auth.refreshToken');
  localStorage.removeItem('sb-yieihrvcbshzmxieflsv-auth-token');
  
  document.cookie.split(';').forEach(cookie => {
    const [name] = cookie.split('=').map(c => c.trim());
    if (name.includes('supabase') || name.includes('sb-')) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  });
  
  sessionStorage.clear();
};
