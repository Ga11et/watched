import {
  Injectable,
  UnprocessableEntityException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { QueryFailedError, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';

export interface LoginResult {
  user: User;
  token: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async register(data: RegisterDto): Promise<User> {
    const name = data.name?.trim();
    const username = data.username?.trim() || null;
    const email = data.email?.trim() || null;

    if (!name) {
      throw new UnprocessableEntityException({
        status: 422,
        message: 'Name is required',
        violations: [{ property: 'name', error: 'Name is required' }],
      });
    }

    if (!data.password?.trim()) {
      throw new UnprocessableEntityException({
        status: 422,
        message: 'Password is required',
        violations: [{ property: 'password', error: 'Password is required' }],
      });
    }

    if (username) {
      const taken = await this.usersRepository
        .createQueryBuilder('user')
        .where('LOWER(user.username) = LOWER(:username)', { username })
        .getExists();
      if (taken) {
        throw new UnprocessableEntityException({
          status: 422,
          message: 'Username already exists',
          violations: [{ field: 'username', error: 'Username already exists' }],
        });
      }
    }

    if (email) {
      const taken = await this.usersRepository
        .createQueryBuilder('user')
        .where('LOWER(user.email) = LOWER(:email)', { email })
        .getExists();
      if (taken) {
        throw new UnprocessableEntityException({
          status: 422,
          message: 'Email already exists',
          violations: [{ field: 'email', error: 'Email already exists' }],
        });
      }
    }

    const passwordHash = await this.hashPassword(data.password);

    const user = this.usersRepository.create({
      name,
      passwordHash,
      username,
      email,
      role: UserRole.USER,
      isActive: true,
    });

    try {
      return await this.usersRepository.save(user);
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
  }

  async login(identifier: string, password: string): Promise<LoginResult> {
    const preparedIdentifier = identifier?.trim();

    const user = await this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(user.username) = LOWER(:identifier)', {
        identifier: preparedIdentifier,
      })
      .orWhere('LOWER(user.email) = LOWER(:identifier)', {
        identifier: preparedIdentifier,
      })
      .orWhere('user.name = :identifier', { identifier: preparedIdentifier })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await this.verifyPassword(
      password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }

    return {
      user,
      token: this.generateLoginToken(),
    };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async findUserById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  private generateLoginToken(): string {
    return randomUUID();
  }
}
