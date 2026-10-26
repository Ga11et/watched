import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from './jwt.service';
import type { AuthUser, JwtPayload } from './auth.types';
import { User } from '../users/entities/user.entity';
import { isUuid } from '../common/utils/uuid.util';

interface AuthRequest {
  headers?: Record<string, string | undefined>;
  user?: AuthUser;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async use(
    request: AuthRequest,
    _response?: unknown,
    next?: () => void,
  ): Promise<AuthRequest | void> {
    const token = this.jwtService.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authorization token required');
    }

    const payload = this.verifyToken(token);

    if (!isUuid(payload.userId)) {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.usersRepository.findOne({
      where: { id: payload.userId },
      select: ['id', 'role', 'isActive'],
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    request.user = { id: user.id, role: user.role };

    if (next) {
      next();
      return;
    }

    return request;
  }

  private verifyToken(token: string): JwtPayload {
    try {
      return this.jwtService.verifyToken(token);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Invalid token';
      throw new UnauthorizedException(message);
    }
  }
}
