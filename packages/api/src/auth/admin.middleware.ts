import {
  ForbiddenException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '../users/entities/user.entity';

interface AuthenticatedRequest {
  user?: {
    role?: UserRole;
  };
}

@Injectable()
export class AdminMiddleware implements NestMiddleware {
  use(
    request: AuthenticatedRequest,
    _response?: unknown,
    next?: () => void,
  ): void {
    if (!request.user) {
      throw new UnauthorizedException('Authorization token required');
    }

    if (request.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }

    if (next) {
      next();
    }
  }
}
