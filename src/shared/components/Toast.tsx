// Re-export Sonner toast for backward compatibility with custom Toast component
export { Toaster } from './ui/sonner';
export { toast } from 'sonner';

// Usage in root layout:
// import { Toaster } from '@/shared/components/Toast';
// <Toaster position="top-right" />
//
// Usage in components:
// import { toast } from '@/shared/components/Toast';
// toast.success('Success message');
// toast.error('Error message');
// toast.warning('Warning message');
// toast.info('Info message');
//
// Advanced usage:
// toast.success('Saved', { description: 'Your changes have been saved' });
// toast.promise(promise, { loading: 'Loading...', success: 'Done!', error: 'Error' });
