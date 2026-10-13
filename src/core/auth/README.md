# core/auth
Handles JWT verification guard and device registration logic.
All API routes extract tenantId and branchId exclusively from the JWT payload — never from request body.
