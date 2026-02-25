import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
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
      throw new UnprocessableEntityException('Name is required');
    }

    if (!data.password?.trim()) {
      throw new UnprocessableEntityException('Password is required');
    }

    if (username) {
      const existingByUsername = await this.usersRepository.findOne({
        where: { username },
      });
      if (existingByUsername) {
        throw new ConflictException('Username already exists');
      }
    }

    if (email) {
      const existingByEmail = await this.usersRepository.findOne({
        where: { email },
      });
      if (existingByEmail) {
        throw new ConflictException('Email already exists');
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

    return this.usersRepository.save(user);
  }

  async login(identifier: string, password: string): Promise<LoginResult> {
    const preparedIdentifier = identifier?.trim();

    const user = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.username = :identifier', { identifier: preparedIdentifier })
      .orWhere('user.email = :identifier', { identifier: preparedIdentifier })
      .orWhere('user.name = :identifier', { identifier: preparedIdentifier })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValidPassword = await this.verifyPassword(
      password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
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

  private generateLoginToken(): string {
    return randomUUID();
  }
}
