export function fieldBorder(hasError: boolean, defaultBorder: string): string {
  return hasError ? 'border-red-500' : defaultBorder;
}
