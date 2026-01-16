export type Role = 'admin' | 'operador' | 'viewer';

export const PERMISSIONS = {
  // Tanks
  TANKS_READ: 'tanks:read',
  TANKS_WRITE: 'tanks:write',

  // Movements
  MOVEMENTS_READ: 'movements:read',
  MOVEMENTS_WRITE: 'movements:write',

  // Users
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',

  // Reports
  REPORTS_READ: 'reports:read',
  REPORTS_EXPORT: 'reports:export',

  // Settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',

  // Sites
  SITES_READ: 'sites:read',
  SITES_WRITE: 'sites:write',

  // Prices
  PRICES_READ: 'prices:read',
  PRICES_WRITE: 'prices:write',

  // Dashboard
  DASHBOARD_READ: 'dashboard:read',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    PERMISSIONS.TANKS_READ,
    PERMISSIONS.TANKS_WRITE,
    PERMISSIONS.MOVEMENTS_READ,
    PERMISSIONS.MOVEMENTS_WRITE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_WRITE,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_WRITE,
    PERMISSIONS.SITES_READ,
    PERMISSIONS.SITES_WRITE,
    PERMISSIONS.PRICES_READ,
    PERMISSIONS.PRICES_WRITE,
    PERMISSIONS.DASHBOARD_READ,
  ],
  operador: [
    PERMISSIONS.TANKS_READ,
    PERMISSIONS.MOVEMENTS_READ,
    PERMISSIONS.MOVEMENTS_WRITE,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.SITES_READ,
    PERMISSIONS.PRICES_READ,
    PERMISSIONS.DASHBOARD_READ,
  ],
  viewer: [
    PERMISSIONS.TANKS_READ,
    PERMISSIONS.MOVEMENTS_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.SITES_READ,
    PERMISSIONS.PRICES_READ,
    PERMISSIONS.DASHBOARD_READ,
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}
