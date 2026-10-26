import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import {
  canEditUser,
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
import { UserDeletionSummaryDto } from './dto/user-deletion-summary.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangeUserRoleDto } from './dto/change-user-role.dto';
import { isUuid } from '../common/utils/uuid.util';
import type { AuthUser } from '../auth/auth.types';

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
      updatedAt: user.updatedAt.toISOString(),
      ...(canViewPrivateUserFields(actor, user.id) && {
        email: user.email,
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
    filters: {
      search?: string;
      role?: UserRole;
      isActive?: boolean;
    },
  ): Promise<User[]> {
    let query = this.usersRepository.createQueryBuilder('user');

    if (filters.isActive !== undefined) {
      query = query.where('user.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    if (filters.role) {
      query = query.andWhere('user.role = :role', { role: filters.role });
    }

    if (filters.search) {
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

  async updateUser(
    identifier: string,
    dto: UpdateUserDto,
    actor: AuthUser,
  ): Promise<User> {
    const id = isUuid(identifier)
      ? identifier
      : (await this.getUserByIdentifier(identifier)).id;

    try {
      return await this.usersRepository.manager.transaction(async (manager) => {
        const current = await manager.findOne(User, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });

        if (!current) {
          throw new NotFoundException('User not found');
        }

        if (!current.isActive && !canViewInactiveUser(actor)) {
          throw new NotFoundException('User not found');
        }

        if (!canEditUser(actor, current.id)) {
          throw new ForbiddenException('Cannot edit this user');
        }

        return this.saveUser(manager, current, normalizeUser(dto));
      });
    } catch (error) {
      throw normalizeConstraintError(error) ?? error;
    }
  }

  async deactivateUser(identifier: string, actor: AuthUser): Promise<User> {
    const id = isUuid(identifier)
      ? identifier
      : (await this.getUserByIdentifier(identifier)).id;

    if (id === actor.id) {
      throw new ConflictException('Cannot deactivate self');
    }

    return this.usersRepository.manager.transaction(async (manager) => {
      const current = await manager.findOne(User, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!current) {
        throw new NotFoundException('User not found');
      }

      return this.saveUser(manager, current, { isActive: false });
    });
  }

  async getDeletionSummary(
    identifier: string,
    actor: AuthUser,
  ): Promise<UserDeletionSummaryDto> {
    const user = await this.getUserByIdentifier(identifier);

    if (user.id === actor.id) {
      throw new ConflictException('Cannot delete self');
    }

    const [books, movies, series, games] = await Promise.all([
      this.userBooksRepository.count({ where: { userId: user.id } }),
      this.userMoviesRepository.count({ where: { userId: user.id } }),
      this.userSeriesRepository.count({ where: { userId: user.id } }),
      this.userGamesRepository.count({ where: { userId: user.id } }),
    ]);

    return { books, movies, series, games };
  }

  async deleteUser(identifier: string, actor: AuthUser): Promise<void> {
    const user = await this.getUserByIdentifier(identifier);

    if (user.id === actor.id) {
      throw new ConflictException('Cannot delete self');
    }

    await this.usersRepository.manager.transaction(async (manager) => {
      await manager.delete(UserBook, { userId: user.id });
      await manager.delete(UserMovie, { userId: user.id });
      await manager.delete(UserSeries, { userId: user.id });
      await manager.delete(UserGame, { userId: user.id });

      const { affected } = await manager.delete(User, { id: user.id });

      if (!affected) {
        throw new NotFoundException('User not found');
      }
    });
  }

  async changeUserRole(
    identifier: string,
    dto: ChangeUserRoleDto,
  ): Promise<User> {
    const id = isUuid(identifier)
      ? identifier
      : (await this.getUserByIdentifier(identifier)).id;

    return this.usersRepository.manager.transaction(async (manager) => {
      const current = await manager.findOne(User, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!current) {
        throw new NotFoundException('User not found');
      }

      return this.saveUser(manager, current, { role: dto.role });
    });
  }

  /**
   * Checks the resulting profile of the locked row and writes only the fields
   * whose values actually differ. When nothing differs no UPDATE runs at all.
   */
  private async saveUser(
    manager: EntityManager,
    current: User,
    fields: EditableUserFields,
  ): Promise<User> {
    const next = { ...current, ...fields };
    const violations = validateUser(next);

    if (Object.keys(violations).length > 0) {
      throw new UnprocessableEntityException({
        status: 422,
        message: Object.values(violations)[0],
        violations,
      });
    }

    await assertAvailable(manager, next, current);

    const changed = Object.fromEntries(
      Object.entries(fields).filter(
        ([key, value]) => value !== current[key as keyof User],
      ),
    );

    if (Object.keys(changed).length > 0) {
      await manager.update(User, { id: current.id }, changed);
    }

    return manager.findOneByOrFail(User, { id: current.id });
  }
}
