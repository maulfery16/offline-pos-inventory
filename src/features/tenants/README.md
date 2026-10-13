# features/tenants
Tenant and Branch management.
- Multi-tenant validation: tenantId and branchId are ALWAYS extracted from JWT payload, never from request body.
- Soft deletes: use deletedAt field — never hard DELETE.
