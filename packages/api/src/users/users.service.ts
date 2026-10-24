import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import {
  canFilterUsersByRole,
  canSearchUsersByEmail,
  canViewInactiveUser,
  canViewPrivateUserFields,
} from './users.policy';
import {
  assertAvailable,
  normalizeConstraintError,
  normalizeUser,
  validateUser,
} from './users.rules';
import { UserBook } from '../user-lists/entities/user-book.entity';
import { UserMovie } from '../user-lists/entities/user-movie.entity';
import { UserSeries } from '../user-lists/entities/user-series.entity';
import { UserGame } from '../user-lists/entities/user-game.entity';
import { UserDto } from './dto/user.dto';
import { UpdateUserDto, ChangeUserRoleDto } from './dto/update-user.dto';
import { isUuid } from '../common/utils/uuid.util';
import type { AuthUser } from '../auth/auth.middleware';

type EditableUserFields = Partial<
  Pick<User, 'name' | 'username' | 'email' | 'role' | 'isActive'>
>;

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

  toUserDto(user: User, actor: AuthUser): UserDto {
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      ...(canViewPrivateUserFields(actor, user.id) && {
        email: user.email,
        updatedAt: user.updatedAt.toISOString(),
      }),
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

    if (!canViewInactiveUser(actor)) {
      query = query.where('user.isActive = :isActive', { isActive: true });
    } else {
      if (filters?.isActive !== undefined) {
        query = query.where('user.isActive = :isActive', {
          isActive: filters.isActive,
        });
      }
    }

    if (canFilterUsersByRole(actor) && filters?.role) {
      query = query.andWhere('user.role = :role', { role: filters.role });
    }

    if (filters?.search) {
      const searchTerm = `%${filters.search.toLowerCase()}%`;
      const emailCondition = canSearchUsersByEmail(actor)
        ? ' OR LOWER(user.email) LIKE :search'
        : '';
      query = query.andWhere(
        `(LOWER(user.name) LIKE :search OR LOWER(user.username) LIKE :search${emailCondition})`,
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
    const fields: EditableUserFields = normalizeUser(dto);

    if (dto.role !== undefined) {
      fields.role = dto.role;
    }

    const id = isUuid(identifier)
      ? identifier
      : (await this.getUserByIdentifier(identifier)).id;
    const user = await this.editUser(id, fields);

    return this.toUserDto(user, actor);
  }

  async deactivateUser(identifier: string, actor: AuthUser): Promise<UserDto> {
    const id = isUuid(identifier)
      ? identifier
      : (await this.getUserByIdentifier(identifier)).id;

    if (id === actor.id) {
      throw new ConflictException('Cannot deactivate self');
    }

    const user = await this.editUser(id, { isActive: false });

    return this.toUserDto(user, actor);
  }

  async deleteUser(identifier: string, actor: AuthUser): Promise<void> {
    const user = await this.getUserByIdentifier(identifier);

    if (user.id === actor.id) {
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
    const id = isUuid(identifier)
      ? identifier
      : (await this.getUserByIdentifier(identifier)).id;

    const user = await this.editUser(id, { role: dto.role });

    return this.toUserDto(user, actor);
  }

  /**
   * Locks the current row by UUID, applies the fields, checks the resulting
   * profile and always writes the given fields, even when nothing actually changes.
   */
  private async editUser(
    userId: string,
    fields: EditableUserFields,
  ): Promise<User> {
    try {
      return await this.usersRepository.manager.transaction(async (manager) => {
        const current = await manager.findOne(User, {
          where: { id: userId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!current) {
          throw new NotFoundException('User not found');
        }

        const next = { ...current, ...fields };
        const violations = validateUser(next);

        if (violations.length > 0) {
          throw new UnprocessableEntityException({
            status: 422,
            message: violations[0].error,
            violations,
          });
        }

        await assertAvailable(manager, next, current);
        await manager.update(User, { id: userId }, fields);

        return manager.findOneByOrFail(User, { id: userId });
      });
    } catch (error) {
      throw normalizeConstraintError(error) ?? error;
    }
  }
}
