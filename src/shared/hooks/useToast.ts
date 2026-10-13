// This hook is now deprecated. Use Sonner's toast directly instead.
// Migration guide:
// 
// Old way:
// const { success, error } = useToast();
// success('Saved!');
// 
// New way:
// import { toast } from 'sonner';
// toast.success('Saved!');
//
// The Toaster component is already added to root layout.

import { toast } from 'sonner';

export const useToast = () => {
  return {
    success: (message: string, description?: string) => 
      toast.success(message, description ? { description } : undefined),
    error: (message: string, description?: string) => 
      toast.error(message, description ? { description } : undefined),
    warning: (message: string, description?: string) => 
      toast.warning(message, description ? { description } : undefined),
    info: (message: string, description?: string) => 
      toast.info(message, description ? { description } : undefined),
    // Legacy compatibility
    showToast: (message: string, variant: 'success' | 'error' | 'warning' | 'info' = 'info') => {
      toast[variant](message);
    },
    hideToast: (id?: string | number) => toast.dismiss(id),
    toasts: [], // Legacy compatibility - no longer used
  };
};
