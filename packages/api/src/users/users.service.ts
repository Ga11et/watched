import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { UserBook } from '../user-lists/entities/user-book.entity';
import { UserMovie } from '../user-lists/entities/user-movie.entity';
import { UserSeries } from '../user-lists/entities/user-series.entity';
import { UserGame } from '../user-lists/entities/user-game.entity';
import { UserDto } from './dto/user.dto';
import { UpdateUserDto, ChangeUserRoleDto } from './dto/update-user.dto';
import { isUuid } from '../common/utils/uuid.util';
import type { AuthUser } from '../auth/auth.middleware';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserBook)
    private userBooksRepository: Repository<UserBook>,
    @InjectRepository(UserMovie)
    private userMoviesRepository: Repository<UserMovie>,
    @InjectRepository(UserSeries)
    private userSeriesRepository: Repository<UserSeries>,
    @InjectRepository(UserGame)
    private userGamesRepository: Repository<UserGame>,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Private-field filtering is introduced in profile block 04.
  toUserDto(user: User, _actor: AuthUser): UserDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async getUserByIdentifier(identifier: string): Promise<User> {
    const user = isUuid(identifier)
      ? await this.usersRepository.findOne({ where: { id: identifier } })
      : await this.usersRepository
          .createQueryBuilder('user')
          .where('LOWER(user.username) = LOWER(:username)', {
            username: identifier,
          })
          .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getAllUsers(
    actor: AuthUser,
    filters?: {
      search?: string;
      role?: UserRole;
      isActive?: boolean;
    },
  ): Promise<User[]> {
    let query = this.usersRepository.createQueryBuilder('user');

    if (actor.role !== UserRole.ADMIN) {
      query = query.where('user.isActive = :isActive', { isActive: true });
    } else {
      if (filters?.isActive !== undefined) {
        query = query.where('user.isActive = :isActive', {
          isActive: filters.isActive,
        });
      }
    }

    if (actor.role === UserRole.ADMIN && filters?.role) {
      query = query.andWhere('user.role = :role', { role: filters.role });
    }

    if (filters?.search) {
      const searchTerm = `%${filters.search.toLowerCase()}%`;
      query = query.andWhere(
        '(LOWER(user.name) LIKE :search OR LOWER(user.username) LIKE :search OR LOWER(user.email) LIKE :search)',
        { search: searchTerm },
      );
    }

    query = query.orderBy('user.createdAt', 'DESC');

    return query.getMany();
  }

  async updateUserProfile(
    identifier: string,
    dto: UpdateUserDto,
    actor: AuthUser,
  ): Promise<UserDto> {
    const user = await this.getUserByIdentifier(identifier);

    if (dto.name !== undefined) {
      user.name = dto.name;
    }

    if (dto.username !== undefined) {
      if (dto.username !== null) {
        const taken = await this.usersRepository
          .createQueryBuilder('user')
          .where('LOWER(user.username) = LOWER(:username)', {
            username: dto.username,
          })
          .andWhere('user.id != :id', { id: user.id })
          .getExists();
        if (taken) {
          throw new UnprocessableEntityException({
            status: 422,
            message: 'Username already exists',
            violations: [
              { field: 'username', error: 'Username already exists' },
            ],
          });
        }
      }
      user.username = dto.username;
    }

    if (dto.email !== undefined) {
      if (dto.email !== null) {
        const taken = await this.usersRepository
          .createQueryBuilder('user')
          .where('LOWER(user.email) = LOWER(:email)', { email: dto.email })
          .andWhere('user.id != :id', { id: user.id })
          .getExists();
        if (taken) {
          throw new UnprocessableEntityException({
            status: 422,
            message: 'Email already exists',
            violations: [{ field: 'email', error: 'Email already exists' }],
          });
        }
      }
      user.email = dto.email;
    }

    if (dto.role !== undefined) {
      user.role = dto.role;
    }

    try {
      await this.usersRepository.save(user);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const { code, constraint } = (error.driverError ?? {}) as {
          code?: string;
          constraint?: string;
        };

        if (code === '23505' && constraint === 'user_username_lower_uq') {
          throw new UnprocessableEntityException({
            status: 422,
            message: 'Username already exists',
            violations: [
              { field: 'username', error: 'Username already exists' },
            ],
          });
        }

        if (code === '23505' && constraint === 'user_email_lower_uq') {
          throw new UnprocessableEntityException({
            status: 422,
            message: 'Email already exists',
            violations: [{ field: 'email', error: 'Email already exists' }],
          });
        }
      }

      throw error;
    }

    return this.toUserDto(user, actor);
  }

  async deactivateUser(identifier: string, actor: AuthUser): Promise<UserDto> {
    const user = await this.getUserByIdentifier(identifier);

    if (user.id === actor.id) {
      throw new ConflictException('Cannot deactivate self');
    }

    user.isActive = false;
    await this.usersRepository.save(user);
    return this.toUserDto(user, actor);
  }

  async deleteUser(identifier: string, callerId: string): Promise<void> {
    const user = await this.getUserByIdentifier(identifier);

    if (user.id === callerId) {
      throw new ConflictException('Cannot delete self');
    }

    await this.userBooksRepository.delete({ userId: user.id });
    await this.userMoviesRepository.delete({ userId: user.id });
    await this.userSeriesRepository.delete({ userId: user.id });
    await this.userGamesRepository.delete({ userId: user.id });

    await this.usersRepository.remove(user);
  }

  async changeUserRole(
    identifier: string,
    dto: ChangeUserRoleDto,
    actor: AuthUser,
  ): Promise<UserDto> {
    const user = await this.getUserByIdentifier(identifier);

    user.role = dto.role;
    await this.usersRepository.save(user);

    return this.toUserDto(user, actor);
  }
}
