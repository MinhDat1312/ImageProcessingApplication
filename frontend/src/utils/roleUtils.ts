/**
 * Normalize role name by removing ROLE_ prefix and checking if it's ADMIN
 * Handles formats like: 'ADMIN', 'ROLE_ADMIN', 'admin', 'role_admin'
 */
export function isAdminRole(roleName: string | null | undefined): boolean {
  if (!roleName) return false
  const normalized = roleName.replace(/^ROLE_/i, '').toUpperCase()
  return normalized === 'ADMIN'
}

/**
 * Normalize role name for display
 * Removes ROLE_ prefix and returns original case or normalized case
 */
export function normalizeRoleName(roleName: string | null | undefined): string {
  if (!roleName) return 'USER'
  return roleName.replace(/^ROLE_/i, '')
}
