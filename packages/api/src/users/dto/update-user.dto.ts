import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsEmail,
  Matches,
  IsEnum,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Отображаемое имя пользователя',
    example: 'New Name',
    minLength: 1,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Уникальный username пользователя',
    example: 'newusername',
    nullable: true,
    minLength: 1,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_]*$/, {
    message:
      'username must contain only alphanumeric characters and underscores',
  })
  username?: string | null;

  @ApiPropertyOptional({
    description: 'Email пользователя',
    example: 'user@example.com',
    nullable: true,
  })
  @IsOptional()
  @IsEmail()
  email?: string | null;
}

export class AdminUpdateUserDto extends UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Роль пользователя',
    enum: UserRole,
    example: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class ChangeUserRoleDto {
  @ApiPropertyOptional({
    description: 'Роль пользователя',
    enum: UserRole,
    example: UserRole.USER,
  })
  @IsEnum(UserRole)
  role: UserRole;
}
