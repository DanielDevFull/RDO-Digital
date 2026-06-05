import type { UserRole } from '@prisma/client';

// Permissões granulares do sistema
export type Permission =
  | 'dashboard:view'
  | 'product:view'
  | 'product:create'
  | 'product:update'
  | 'product:delete'
  | 'movement:view'
  | 'movement:create'
  | 'restricted:request'
  | 'restricted:approve'
  | 'stock:view'
  | 'stock:manage'
  | 'report:view'
  | 'report:export'
  | 'user:view'
  | 'user:manage'
  | 'audit:view';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMINISTRADOR: [
    'dashboard:view',
    'product:view',
    'product:create',
    'product:update',
    'product:delete',
    'movement:view',
    'movement:create',
    'restricted:request',
    'restricted:approve',
    'stock:view',
    'stock:manage',
    'report:view',
    'report:export',
    'user:view',
    'user:manage',
    'audit:view',
  ],
  SUPERVISOR: [
    'dashboard:view',
    'product:view',
    'product:update',
    'movement:view',
    'movement:create',
    'restricted:request',
    'restricted:approve',
    'stock:view',
    'report:view',
    'report:export',
    'user:view',
    'audit:view',
  ],
  OPERADOR: [
    'dashboard:view',
    'product:view',
    'movement:view',
    'movement:create',
    'restricted:request',
    'stock:view',
    'report:view',
  ],
  CONSULTA: [
    'dashboard:view',
    'product:view',
    'movement:view',
    'stock:view',
    'report:view',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function permissionsFor(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMINISTRADOR: 'Administrador',
  SUPERVISOR: 'Supervisor',
  OPERADOR: 'Operador',
  CONSULTA: 'Consulta',
};
