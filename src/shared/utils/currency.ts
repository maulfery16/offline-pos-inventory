/**
 * Format a number as Indonesian Rupiah.
 * @example formatIDR(15000) => "Rp 15.000"
 */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Parse a formatted IDR string back to a number.
 * @example parseIDR("Rp 15.000") => 15000
 */
export function parseIDR(formatted: string): number {
  return Number(formatted.replace(/[^0-9]/g, ''));
}
