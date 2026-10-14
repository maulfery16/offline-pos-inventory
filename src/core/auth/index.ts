import { SignJWT, jwtVerify } from 'jose';
import type { JWTPayload } from './types';

/**
 * Returns the JWT secret as a Uint8Array.
 * Throws if JWT_SECRET env var is not set.
 */
function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Signs a JWT with the given payload.
 * @param payload - Must include tenantId, branchId, deviceId, role
 * @param expiresIn - e.g. '30d' for device token, '8h' for session token
 * @returns Signed JWT string
 */
export async function signJWT(payload: JWTPayload, expiresIn: string): Promise<string> {
  const secret = getSecret();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

/**
 * Verifies a JWT and returns its payload.
 * Throws if the token is invalid, expired, or the secret is missing.
 * @param token - JWT string from Authorization header
 * @returns Verified JWTPayload
 */
export async function verifyJWT(token: string): Promise<JWTPayload> {
  const secret = getSecret();
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as JWTPayload;
}
