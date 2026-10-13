import { format, formatDistanceToNow, isPast, isWithinInterval, addDays } from 'date-fns';
import { id } from 'date-fns/locale';

/** Format a date to a readable Indonesian locale string, e.g. "25 Jul 2025" */
export function formatDate(date: Date | string): string {
  return format(new Date(date), 'd MMM yyyy', { locale: id });
}

/** Format a date with time, e.g. "25 Jul 2025, 14:30" */
export function formatDateTime(date: Date | string): string {
  return format(new Date(date), 'd MMM yyyy, HH:mm', { locale: id });
}

/** Returns relative time string, e.g. "3 hari lagi" or "2 hari yang lalu" */
export function formatRelative(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: id });
}

/** Check if a batch expiry date has already passed */
export function isExpired(expiryDate: Date | string): boolean {
  return isPast(new Date(expiryDate));
}

/** Check if a batch expires within the given number of days (default: 30) */
export function isNearExpiry(expiryDate: Date | string, withinDays = 30): boolean {
  const expiry = new Date(expiryDate);
  return isWithinInterval(expiry, { start: new Date(), end: addDays(new Date(), withinDays) });
}
