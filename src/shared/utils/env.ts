/**
 * Validates that a required environment variable is set.
 * Throws at startup if any required variable is missing.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  DATABASE_URL: requireEnv('DATABASE_URL'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '365d',
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? 'Offline POS Inventory',
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
  NEXT_PUBLIC_SYNC_INTERVAL_MS: Number(process.env.NEXT_PUBLIC_SYNC_INTERVAL_MS ?? '30000'),
};
