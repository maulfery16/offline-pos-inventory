export function computeDiff<T extends Record<string, unknown>>(
  original: T,
  current: T,
): Partial<T> {
  const changed: Partial<T> = {};
  (Object.keys(current) as (keyof T)[]).forEach((key) => {
    if (current[key] !== original[key]) changed[key] = current[key];
  });
  return changed;
}
