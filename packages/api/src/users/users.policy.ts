import type { AuthUser } from '../auth/auth.middleware';
import { UserRole } from './entities/user.entity';

export function canViewPrivateUserFields(
  actor: AuthUser,
  userId: string,
): boolean {
  return actor.role === UserRole.ADMIN || actor.id === userId;
}

export function canSearchUsersByEmail(actor: AuthUser): boolean {
  return actor.role === UserRole.ADMIN;
}

export function canFilterUsersByRole(actor: AuthUser): boolean {
  return actor.role === UserRole.ADMIN;
}

export function canViewInactiveUser(actor: AuthUser): boolean {
  return actor.role === UserRole.ADMIN;
}

export function canEditUser(actor: AuthUser, userId: string): boolean {
  return (
    actor.role === UserRole.ADMIN ||
    (actor.role === UserRole.USER && actor.id === userId)
  );
}
