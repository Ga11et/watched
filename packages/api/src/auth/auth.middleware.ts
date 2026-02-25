import {
  ForbiddenException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from './jwt.service';

interface AuthRequest {
  headers?: Record<string, string | undefined>;
  user?: unknown;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  async use(
    request: AuthRequest,
    _response?: unknown,
    next?: () => void,
  ): Promise<AuthRequest | void> {
    const token = this.jwtService.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authorization token required');
    }

    try {
      const payload = await Promise.resolve(this.jwtService.verifyToken(token));

      request.user = {
        id: payload.userId,
        ...payload,
      };

      if (next) {
        next();
        return;
      }

      return request;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Invalid token';
      throw new ForbiddenException(message);
    }
  }
}
