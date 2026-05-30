import type { UserRole } from './types';

export type Permission =
  | 'bills:create'
  | 'bills:update'
  | 'bills:complete'
  | 'rooms:manage'
  | 'food:manage'
  | 'amenities:manage'
  | 'ledger:view'
  | 'ledger:clear'
  | 'settings:manage'
  | 'users:manage'
  | 'discounts:manage';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'bills:create',
    'bills:update',
    'bills:complete',
    'rooms:manage',
    'food:manage',
    'amenities:manage',
    'ledger:view',
    'ledger:clear',
    'settings:manage',
    'users:manage',
    'discounts:manage',
  ],
  receptionist: [
    'bills:create',
    'bills:update',
    'bills:complete',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function getRoleLabel(role: UserRole): string {
  return role === 'super_admin' ? 'Super Admin' : 'Receptionist';
}
