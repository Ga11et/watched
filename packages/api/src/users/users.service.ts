import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { UserBook } from '../user-lists/entities/user-book.entity';
import { UserMovie } from '../user-lists/entities/user-movie.entity';
import { UserSeries } from '../user-lists/entities/user-series.entity';
import { UserGame } from '../user-lists/entities/user-game.entity';
import { UserDto } from './dto/user.dto';
import {
  UpdateUserDto,
  AdminUpdateUserDto,
  ChangeUserRoleDto,
} from './dto/update-user.dto';
import { isUuid } from '../common/utils/uuid.util';

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

  private toUserDto(user: User): UserDto {
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

  async getUserByIdentifier(identifier: string): Promise<User | null> {
    if (isUuid(identifier)) {
      return this.usersRepository.findOne({
        where: { id: identifier },
      });
    }

    return this.usersRepository.findOne({
      where: { username: identifier },
    });
  }

  async getUserByIdentifierOrFail(identifier: string): Promise<User> {
    const user = await this.getUserByIdentifier(identifier);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getAllUsers(
    userRole: UserRole,
    filters?: {
      search?: string;
      role?: UserRole;
      isActive?: boolean;
    },
  ): Promise<User[]> {
    let query = this.usersRepository.createQueryBuilder('user');

    if (userRole !== UserRole.ADMIN) {
      query = query.where('user.isActive = :isActive', { isActive: true });
    } else {
      if (filters?.isActive !== undefined) {
        query = query.where('user.isActive = :isActive', {
          isActive: filters.isActive,
        });
      }
    }

    if (userRole === UserRole.ADMIN && filters?.role) {
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

  private throwDuplicateError(field: string, message: string): never {
    const response = {
      status: 422,
      message: 'Unprocessable entity',
      violations: [{ field, message }],
    };
    throw new BadRequestException(response);
  }

  async updateUserProfile(
    identifier: string,
    dto: UpdateUserDto,
  ): Promise<UserDto> {
    const user = await this.getUserByIdentifierOrFail(identifier);

    if (dto.name !== undefined) {
      user.name = dto.name;
    }

    if (dto.username !== undefined) {
      if (dto.username !== null && dto.username !== user.username) {
        const existingUser = await this.usersRepository.findOne({
          where: { username: dto.username },
        });
        if (existingUser) {
          this.throwDuplicateError('username', 'Username already taken');
        }
      }
      user.username = dto.username;
    }

    if (dto.email !== undefined) {
      if (dto.email !== null && dto.email !== user.email) {
        const existingUser = await this.usersRepository.findOne({
          where: { email: dto.email },
        });
        if (existingUser) {
          this.throwDuplicateError('email', 'Email already taken');
        }
      }
      user.email = dto.email;
    }

    await this.usersRepository.save(user);
    return this.toUserDto(user);
  }

  async adminUpdateUser(
    identifier: string,
    dto: AdminUpdateUserDto,
  ): Promise<UserDto> {
    const user = await this.getUserByIdentifierOrFail(identifier);

    if (dto.name !== undefined) {
      user.name = dto.name;
    }

    if (dto.username !== undefined) {
      if (dto.username !== null && dto.username !== user.username) {
        const existingUser = await this.usersRepository.findOne({
          where: { username: dto.username },
        });
        if (existingUser) {
          this.throwDuplicateError('username', 'Username already taken');
        }
      }
      user.username = dto.username;
    }

    if (dto.email !== undefined) {
      if (dto.email !== null && dto.email !== user.email) {
        const existingUser = await this.usersRepository.findOne({
          where: { email: dto.email },
        });
        if (existingUser) {
          this.throwDuplicateError('email', 'Email already taken');
        }
      }
      user.email = dto.email;
    }

    if (dto.role !== undefined) {
      user.role = dto.role;
    }

    await this.usersRepository.save(user);
    return this.toUserDto(user);
  }

  async deactivateUser(identifier: string, callerId: string): Promise<UserDto> {
    const user = await this.getUserByIdentifierOrFail(identifier);

    if (user.id === callerId) {
      throw new ConflictException('Cannot deactivate self');
    }

    user.isActive = false;
    await this.usersRepository.save(user);
    return this.toUserDto(user);
  }

  async adminDeleteUser(identifier: string, callerId: string): Promise<void> {
    const user = await this.getUserByIdentifierOrFail(identifier);

    if (user.id === callerId) {
      throw new ConflictException('Cannot delete self');
    }

    await this.userBooksRepository.delete({ userId: user.id });
    await this.userMoviesRepository.delete({ userId: user.id });
    await this.userSeriesRepository.delete({ userId: user.id });
    await this.userGamesRepository.delete({ userId: user.id });

    await this.usersRepository.remove(user);
  }

  async adminChangeUserRole(
    identifier: string,
    dto: ChangeUserRoleDto,
  ): Promise<UserDto> {
    const user = await this.getUserByIdentifierOrFail(identifier);

    user.role = dto.role;
    await this.usersRepository.save(user);

    return this.toUserDto(user);
  }
}
