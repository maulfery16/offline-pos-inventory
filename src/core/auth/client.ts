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
