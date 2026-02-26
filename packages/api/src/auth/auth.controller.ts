import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtService } from './jwt.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { AuthUserDto } from './dto/auth-user.dto';
import { UsersResponseDto } from './dto/users-response.dto';
import { User } from '../users/entities/user.entity';

interface AuthenticatedRequest {
  user?: {
    id: string;
  };
}

@ApiTags('auth', 'users')
@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('auth/register')
  @ApiOperation({ summary: 'Регистрация нового пользователя' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    const user = await this.authService.register(dto);
    return {
      user: this.toAuthUserDto(user),
      token: this.jwtService.generateToken(user),
    };
  }

  @Post('auth/login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Вход пользователя' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    const result = await this.authService.login(dto.identifier, dto.password);
    return {
      user: this.toAuthUserDto(result.user),
      token: this.jwtService.generateToken(result.user),
    };
  }

  @Get('users')
  @ApiOperation({ summary: 'Получение списка активных пользователей' })
  @ApiResponse({ status: 200, type: UsersResponseDto })
  async getActiveUsers(): Promise<UsersResponseDto> {
    const users = await this.authService.getActiveUsers();
    return {
      users: users.map((user) => this.toAuthUserDto(user)),
    };
  }

  @Get('auth/me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получение текущего пользователя' })
  @ApiResponse({ status: 200, type: AuthUserDto })
  async getMe(@Req() request: AuthenticatedRequest): Promise<AuthUserDto> {
    const userId = request.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Authorization token required');
    }

    const user = await this.authService.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.toAuthUserDto(user);
  }

  private toAuthUserDto(user: User): AuthUserDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
