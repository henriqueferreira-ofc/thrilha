
// Export Sonner toast functionality
import { toast } from 'sonner';

// Radix UI doesn't export useToast, so we need to implement our own
import { useContext } from 'react';
import { ToastContext } from '@/components/ui/toast';

// Create a hook to access toast functionality
export const useToast = () => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  
  return context;
};

// Re-export the toast function from sonner
export { toast };
