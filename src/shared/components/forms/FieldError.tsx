import { ReactNode } from 'react';

interface FieldErrorProps {
  children?: ReactNode;
}

export function FieldError({ children }: FieldErrorProps) {
  if (!children) return null;
  return <p className="text-xs text-red-500 mt-1">{children}</p>;
}
