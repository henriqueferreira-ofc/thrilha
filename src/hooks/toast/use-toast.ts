
// Export Sonner toast functionality
import { toast } from 'sonner';
import { useContext } from 'react';
import { ToastContext } from '@/components/ui/toast';
import { useState, useEffect } from 'react';
import { listeners, memoryState } from './store';

// Create a hook to access toast functionality
export const useToast = () => {
  const [state, setState] = useState(memoryState);
  
  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
  };
};

// Re-export the toast function from sonner
export { toast };
