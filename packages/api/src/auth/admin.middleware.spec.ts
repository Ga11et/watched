import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AdminMiddleware } from './admin.middleware';
import { UserRole } from '../users/entities/user.entity';

describe('AdminMiddleware', () => {
  let adminMiddleware: AdminMiddleware;

  beforeEach(() => {
    adminMiddleware = new AdminMiddleware();
  });

  it('should throw unauthorized when request user is missing', () => {
    expect(() => adminMiddleware.use({})).toThrow(UnauthorizedException);
    expect(() => adminMiddleware.use({})).toThrow(
      'Authorization token required',
    );
  });

  it('should throw forbidden when user role is not admin', () => {
    expect(() =>
      adminMiddleware.use({
        user: {
          role: UserRole.USER,
        },
      }),
    ).toThrow(ForbiddenException);

    expect(() =>
      adminMiddleware.use({
        user: {
          role: UserRole.USER,
        },
      }),
    ).toThrow('Admin access required');
  });

  it('should call next when role is admin', () => {
    const next = jest.fn();

    adminMiddleware.use(
      {
        user: {
          role: UserRole.ADMIN,
        },
      },
      undefined,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
  });
});
