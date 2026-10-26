import type { UserRole } from '../users/entities/user.entity';

export interface AuthUser {
  id: string;
  role: UserRole;
}

export interface JwtPayload {
  userId: string;
  username: string | null;
  name: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
