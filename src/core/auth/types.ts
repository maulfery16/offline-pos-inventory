/**
 * JWT types for the Offline POS Inventory System.
 * CRITICAL: tenantId and branchId are ONLY set at JWT creation time.
 * NEVER read these from request body — always extract from verified JWT payload.
 */

export type UserRole = 'device' | 'cashier' | 'manager' | 'owner';

export interface JWTPayload {
  /** Tenant identifier — extracted from JWT only, never from request body */
  tenantId: string;
  /** Branch identifier — extracted from JWT only, never from request body */
  branchId: string;
  /** Registered device ID */
  deviceId: string;
  /** Role determines access level */
  role: UserRole;
  // --- Session-level fields (populated on cashier PIN login) ---
  /** User ID of the logged-in cashier/manager/owner */
  userId?: string;
  /** Display name of the logged-in user */
  userName?: string;
}
