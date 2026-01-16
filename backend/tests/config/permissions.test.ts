import { describe, it, expect } from '@jest/globals';
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  Role,
} from '../../src/config/permissions.js';

describe('Permissions', () => {
  describe('PERMISSIONS constants', () => {
    it('should have all required permission keys', () => {
      expect(PERMISSIONS.TANKS_READ).toBe('tanks:read');
      expect(PERMISSIONS.TANKS_WRITE).toBe('tanks:write');
      expect(PERMISSIONS.MOVEMENTS_READ).toBe('movements:read');
      expect(PERMISSIONS.MOVEMENTS_WRITE).toBe('movements:write');
      expect(PERMISSIONS.USERS_READ).toBe('users:read');
      expect(PERMISSIONS.USERS_WRITE).toBe('users:write');
      expect(PERMISSIONS.SETTINGS_READ).toBe('settings:read');
      expect(PERMISSIONS.SETTINGS_WRITE).toBe('settings:write');
      expect(PERMISSIONS.DASHBOARD_READ).toBe('dashboard:read');
    });
  });

  describe('ROLE_PERMISSIONS', () => {
    it('admin should have all permissions', () => {
      const adminPermissions = ROLE_PERMISSIONS.admin;

      expect(adminPermissions).toContain(PERMISSIONS.TANKS_READ);
      expect(adminPermissions).toContain(PERMISSIONS.TANKS_WRITE);
      expect(adminPermissions).toContain(PERMISSIONS.MOVEMENTS_READ);
      expect(adminPermissions).toContain(PERMISSIONS.MOVEMENTS_WRITE);
      expect(adminPermissions).toContain(PERMISSIONS.USERS_READ);
      expect(adminPermissions).toContain(PERMISSIONS.USERS_WRITE);
      expect(adminPermissions).toContain(PERMISSIONS.SETTINGS_READ);
      expect(adminPermissions).toContain(PERMISSIONS.SETTINGS_WRITE);
      expect(adminPermissions).toContain(PERMISSIONS.DASHBOARD_READ);
    });

    it('operador should have limited write permissions', () => {
      const operadorPermissions = ROLE_PERMISSIONS.operador;

      expect(operadorPermissions).toContain(PERMISSIONS.TANKS_READ);
      expect(operadorPermissions).not.toContain(PERMISSIONS.TANKS_WRITE);
      expect(operadorPermissions).toContain(PERMISSIONS.MOVEMENTS_READ);
      expect(operadorPermissions).toContain(PERMISSIONS.MOVEMENTS_WRITE);
      expect(operadorPermissions).not.toContain(PERMISSIONS.USERS_READ);
      expect(operadorPermissions).not.toContain(PERMISSIONS.USERS_WRITE);
      expect(operadorPermissions).toContain(PERMISSIONS.DASHBOARD_READ);
    });

    it('viewer should have read-only permissions', () => {
      const viewerPermissions = ROLE_PERMISSIONS.viewer;

      expect(viewerPermissions).toContain(PERMISSIONS.TANKS_READ);
      expect(viewerPermissions).not.toContain(PERMISSIONS.TANKS_WRITE);
      expect(viewerPermissions).toContain(PERMISSIONS.MOVEMENTS_READ);
      expect(viewerPermissions).not.toContain(PERMISSIONS.MOVEMENTS_WRITE);
      expect(viewerPermissions).not.toContain(PERMISSIONS.USERS_READ);
      expect(viewerPermissions).not.toContain(PERMISSIONS.USERS_WRITE);
      expect(viewerPermissions).not.toContain(PERMISSIONS.SETTINGS_WRITE);
      expect(viewerPermissions).toContain(PERMISSIONS.DASHBOARD_READ);
    });
  });

  describe('hasPermission', () => {
    it('should return true when role has permission', () => {
      expect(hasPermission('admin', PERMISSIONS.USERS_WRITE)).toBe(true);
      expect(hasPermission('operador', PERMISSIONS.MOVEMENTS_WRITE)).toBe(true);
      expect(hasPermission('viewer', PERMISSIONS.TANKS_READ)).toBe(true);
    });

    it('should return false when role does not have permission', () => {
      expect(hasPermission('viewer', PERMISSIONS.USERS_WRITE)).toBe(false);
      expect(hasPermission('operador', PERMISSIONS.TANKS_WRITE)).toBe(false);
      expect(hasPermission('viewer', PERMISSIONS.SETTINGS_WRITE)).toBe(false);
    });

    it('should return false for invalid role', () => {
      expect(hasPermission('invalid' as Role, PERMISSIONS.TANKS_READ)).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if role has at least one permission', () => {
      expect(hasAnyPermission('viewer', [
        PERMISSIONS.USERS_WRITE,
        PERMISSIONS.TANKS_READ,
      ])).toBe(true);
    });

    it('should return false if role has none of the permissions', () => {
      expect(hasAnyPermission('viewer', [
        PERMISSIONS.USERS_WRITE,
        PERMISSIONS.SETTINGS_WRITE,
      ])).toBe(false);
    });

    it('should return false for empty permissions array', () => {
      expect(hasAnyPermission('admin', [])).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if role has all permissions', () => {
      expect(hasAllPermissions('admin', [
        PERMISSIONS.USERS_WRITE,
        PERMISSIONS.TANKS_WRITE,
        PERMISSIONS.SETTINGS_WRITE,
      ])).toBe(true);
    });

    it('should return false if role is missing any permission', () => {
      expect(hasAllPermissions('operador', [
        PERMISSIONS.MOVEMENTS_WRITE,
        PERMISSIONS.TANKS_WRITE,
      ])).toBe(false);
    });

    it('should return true for empty permissions array', () => {
      expect(hasAllPermissions('viewer', [])).toBe(true);
    });
  });
});
