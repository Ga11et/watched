import { UnprocessableEntityException } from '@nestjs/common';
import { isEmail } from 'class-validator';
import { EntityManager, QueryFailedError } from 'typeorm';
import { User } from './entities/user.entity';

type BasicUserFields = Pick<User, 'name' | 'username' | 'email'>;

export interface UserViolation {
  field: keyof BasicUserFields | 'password';
  error: string;
}

/** Trims provided strings; a blank username or email becomes null. Absent fields stay absent. */
export function normalizeUser(
  input: Partial<BasicUserFields>,
): Partial<BasicUserFields> {
  const fields: Partial<BasicUserFields> = {};

  if (input.name !== undefined) {
    fields.name = input.name.trim();
  }

  if (input.username !== undefined) {
    fields.username = input.username?.trim() || null;
  }

  if (input.email !== undefined) {
    fields.email = input.email?.trim() || null;
  }

  return fields;
}

/** Checks the whole resulting profile, including fields the request did not change. */
export function validateUser(user: BasicUserFields): UserViolation[] {
  const violations: UserViolation[] = [];
  const nameLength = [...user.name.trim()].length;

  if (nameLength === 0) {
    violations.push({ field: 'name', error: 'Name is required' });
  } else if (nameLength > 255) {
    violations.push({
      field: 'name',
      error: 'Name must be at most 255 characters',
    });
  }

  if (user.username !== null && !/^[A-Za-z0-9_]{1,50}$/.test(user.username)) {
    violations.push({
      field: 'username',
      error:
        'Username must contain 1 to 50 Latin letters, digits or underscores',
    });
  }

  if (user.email !== null && !isEmail(user.email)) {
    violations.push({
      field: 'email',
      error: 'Email must be a valid email address',
    });
  }

  if (user.username === null && user.email === null) {
    violations.push(
      { field: 'username', error: 'Username or email is required' },
      { field: 'email', error: 'Username or email is required' },
    );
  }

  return violations;
}

/**
 * Rejects identifiers that the profile introduces while another user holds them, case-insensitively.
 * An email must not match another user's username either; the user's own stored values never conflict.
 */
export async function assertAvailable(
  manager: EntityManager,
  fields: BasicUserFields,
  target?: User,
): Promise<void> {
  const violations: UserViolation[] = [];

  if (fields.username !== null && fields.username !== target?.username) {
    const taken = await manager
      .createQueryBuilder(User, 'user')
      .where('LOWER(user.username) = LOWER(:username)', {
        username: fields.username,
      })
      .andWhere('user.id IS DISTINCT FROM :id', { id: target?.id ?? null })
      .getExists();

    if (taken) {
      violations.push({ field: 'username', error: 'Username already exists' });
    }
  }

  if (fields.email !== null && fields.email !== target?.email) {
    const taken = await manager
      .createQueryBuilder(User, 'user')
      .where(
        '(LOWER(user.email) = LOWER(:email) OR LOWER(user.username) = LOWER(:email))',
        { email: fields.email },
      )
      .andWhere('user.id IS DISTINCT FROM :id', { id: target?.id ?? null })
      .getExists();

    if (taken) {
      violations.push({ field: 'email', error: 'Email already exists' });
    }
  }

  if (violations.length > 0) {
    throw new UnprocessableEntityException({
      status: 422,
      message: violations[0].error,
      violations,
    });
  }
}

/** Turns a known unique-index conflict (23505) into 422 for its field; returns undefined for any other error. */
export function normalizeConstraintError(
  error: unknown,
): UnprocessableEntityException | undefined {
  if (error instanceof QueryFailedError) {
    const { code, constraint } = (error.driverError ?? {}) as {
      code?: string;
      constraint?: string;
    };

    if (code === '23505' && constraint === 'user_username_lower_uq') {
      return new UnprocessableEntityException({
        status: 422,
        message: 'Username already exists',
        violations: [{ field: 'username', error: 'Username already exists' }],
      });
    }

    if (code === '23505' && constraint === 'user_email_lower_uq') {
      return new UnprocessableEntityException({
        status: 422,
        message: 'Email already exists',
        violations: [{ field: 'email', error: 'Email already exists' }],
      });
    }
  }

  return undefined;
}
