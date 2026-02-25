import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Имя пользователя',
    example: 'Test User',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Пароль пользователя',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    description: 'Уникальный username пользователя',
    example: 'testuser',
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    description: 'Уникальный email пользователя',
    example: 'test@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}
