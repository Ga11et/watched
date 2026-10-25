import {
  Injectable,
  UnprocessableEntityException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../users/entities/user.entity';
import {
  assertAvailable,
  normalizeConstraintError,
  normalizeUser,
  validateUser,
} from '../users/users.rules';
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
    const user: Pick<User, 'name' | 'username' | 'email'> = {
      name: '',
      username: null,
      email: null,
      ...normalizeUser(data),
    };
    const violations = validateUser(user);

    if (!data.password.trim()) {
      violations.push({ field: 'password', error: 'Password is required' });
    }

    if (violations.length > 0) {
      throw new UnprocessableEntityException({
        status: 422,
        message: violations[0].error,
        violations,
      });
    }

    await assertAvailable(this.usersRepository.manager, user);

    const entity = this.usersRepository.create({
      ...user,
      passwordHash: await this.hashPassword(data.password),
      role: UserRole.USER,
      isActive: true,
    });

    try {
      return await this.usersRepository.save(entity);
    } catch (error) {
      throw normalizeConstraintError(error) ?? error;
    }
  }

  async login(identifier: string, password: string): Promise<LoginResult> {
    const preparedIdentifier = identifier?.trim();

    if (!preparedIdentifier) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const candidates = await this.usersRepository
      .createQueryBuilder('user')
      .where(
        '(LOWER(user.username) = LOWER(:identifier) OR LOWER(user.email) = LOWER(:identifier))',
        { identifier: preparedIdentifier },
      )
      .take(2)
      .getMany();

    if (candidates.length !== 1) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const [user] = candidates;

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
