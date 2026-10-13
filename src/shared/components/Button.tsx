// Re-export shadcn button with backward compatibility
export { Button, buttonVariants } from './ui/button';
export type { ButtonProps } from './ui/button';

// Type aliases for backward compatibility
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';
