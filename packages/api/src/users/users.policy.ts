import type { AuthUser } from '../auth/auth.types';
import { UserRole } from './entities/user.entity';

// View

export function canViewPrivateUserFields(
  actor: AuthUser,
  userId: string,
): boolean {
  return actor.role === UserRole.ADMIN || actor.id === userId;
}

export function canViewInactiveUser(actor: AuthUser): boolean {
  return actor.role === UserRole.ADMIN;
}

export function canSearchUsersByEmail(actor: AuthUser): boolean {
  return actor.role === UserRole.ADMIN;
}

export function canFilterUsersByRole(actor: AuthUser): boolean {
  return actor.role === UserRole.ADMIN;
}

// Edit

export function canEditUser(actor: AuthUser, userId: string): boolean {
  return (
    actor.role === UserRole.ADMIN ||
    (actor.role === UserRole.USER && actor.id === userId)
  );
}

export function canChangeUserRole(actor: AuthUser): boolean {
  return actor.role === UserRole.ADMIN;
}

export function canDeactivateUsers(actor: AuthUser): boolean {
  return actor.role === UserRole.ADMIN;
}

// Delete

export function canDeleteUsers(actor: AuthUser): boolean {
  return actor.role === UserRole.ADMIN;
}
