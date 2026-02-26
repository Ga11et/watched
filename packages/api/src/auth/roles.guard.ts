import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../users/entities/user.entity';
import { UserBook } from '../user-lists/entities/user-book.entity';
import { UserMovie } from '../user-lists/entities/user-movie.entity';
import { UserSeries } from '../user-lists/entities/user-series.entity';
import { UserGame } from '../user-lists/entities/user-game.entity';

interface RequestUser {
  id: string;
  role: UserRole;
}

interface AuthenticatedRequest {
  method: string;
  path: string;
  params?: {
    id?: string;
  };
  user?: RequestUser;
}

interface OwnableEntity {
  id: string;
  userId: string;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    @InjectRepository(UserBook)
    private readonly userBooksRepository: Repository<UserBook>,
    @InjectRepository(UserMovie)
    private readonly userMoviesRepository: Repository<UserMovie>,
    @InjectRepository(UserSeries)
    private readonly userSeriesRepository: Repository<UserSeries>,
    @InjectRepository(UserGame)
    private readonly userGamesRepository: Repository<UserGame>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const method = request.method.toUpperCase();

    if (!['POST', 'PUT', 'DELETE'].includes(method)) {
      return true;
    }

    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authorization token required');
    }

    if (user.role === UserRole.ADMIN) {
      return true;
    }

    if (user.role === UserRole.GUEST) {
      throw new ForbiddenException('Access denied');
    }

    if (method === 'POST') {
      return true;
    }

    const resourceId = request.params?.id;

    if (!resourceId) {
      throw new ForbiddenException('Access denied');
    }

    const repository = this.resolveRepository(request.path);

    if (!repository) {
      return true;
    }

    const resource = await repository.findOne({
      where: { id: resourceId },
      select: ['id', 'userId'],
    });

    if (!resource) {
      throw new NotFoundException('Record not found');
    }

    if (resource.userId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    return true;
  }

  private resolveRepository(path: string): Repository<OwnableEntity> | null {
    if (path.startsWith('/user-books')) {
      return this.userBooksRepository as unknown as Repository<OwnableEntity>;
    }

    if (path.startsWith('/user-movies')) {
      return this.userMoviesRepository as unknown as Repository<OwnableEntity>;
    }

    if (path.startsWith('/user-series')) {
      return this.userSeriesRepository as unknown as Repository<OwnableEntity>;
    }

    if (path.startsWith('/user-games')) {
      return this.userGamesRepository as unknown as Repository<OwnableEntity>;
    }

    return null;
  }
}
