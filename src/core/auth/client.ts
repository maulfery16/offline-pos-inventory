'use client'

const DEVICE_TOKEN_KEY = 'deviceToken'
const SESSION_TOKEN_KEY = 'sessionToken'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

// Device JWT (30d) — issued on device registration
export function getDeviceToken(): string | null {
  if (!isBrowser()) return null
  return localStorage.getItem(DEVICE_TOKEN_KEY)
}

export function setDeviceToken(token: string): void {
  if (!isBrowser()) return
  localStorage.setItem(DEVICE_TOKEN_KEY, token)
}

// Session token (8h) — issued on cashier PIN verify
export function getSessionToken(): string | null {
  if (!isBrowser()) return null
  return localStorage.getItem(SESSION_TOKEN_KEY)
}

export function setSessionToken(token: string): void {
  if (!isBrowser()) return
  localStorage.setItem(SESSION_TOKEN_KEY, token)
}

export function clearDeviceToken(): void {
  if (!isBrowser()) return
  localStorage.removeItem(DEVICE_TOKEN_KEY)
}

export function clearSessionToken(): void {
  if (!isBrowser()) return
  localStorage.removeItem(SESSION_TOKEN_KEY)
}

export function clearAllTokens(): void {
  if (!isBrowser()) return
  localStorage.removeItem(DEVICE_TOKEN_KEY)
  localStorage.removeItem(SESSION_TOKEN_KEY)
}

export function isDeviceRegistered(): boolean {
  return !!getDeviceToken()
}

// Returns Authorization header — prefers session token, falls back to device token
export function getAuthHeaders(): Record<string, string> {
  const token = getSessionToken() || getDeviceToken()
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

/**
 * Decodes the role claim from the session JWT without verifying the signature.
 * Signature verification happens server-side; this is purely for UI gating.
 * Returns null if no session token exists or the payload cannot be parsed.
 */
export function decodeSessionRole(): string | null {
  const token = getSessionToken()
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    // Base64url → Base64 → JSON
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    ) as Record<string, unknown>
    return typeof payload.role === 'string' ? payload.role : null
  } catch {
    return null
  }
}

/**
 * Client-side JWT payload decoder (no signature verification).
 * Only use for UI-layer decisions (e.g. role guards, display data).
 * Server routes MUST use verifyJWT() from core/auth/index.ts instead.
 */
export function decodeSessionToken<T = Record<string, unknown>>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // Base64url → Base64 → JSON
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
