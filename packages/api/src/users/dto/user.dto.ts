import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class UserDto {
  @ApiProperty({
    description: 'Уникальный идентификатор пользователя',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'Уникальный username пользователя',
    example: 'testuser',
    nullable: true,
  })
  username: string | null;

  @ApiPropertyOptional({
    description: 'Уникальный email пользователя',
    example: 'test@example.com',
    nullable: true,
  })
  email: string | null;

  @ApiProperty({
    description: 'Отображаемое имя пользователя',
    example: 'Test User',
  })
  name: string;

  @ApiProperty({
    description: 'Роль пользователя',
    enum: UserRole,
    example: UserRole.USER,
  })
  role: UserRole;

  @ApiProperty({
    description: 'Признак активности пользователя',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Дата создания пользователя',
    example: '2026-01-22T17:00:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Дата обновления пользователя',
    example: '2026-01-22T17:00:00Z',
  })
  updatedAt: string;
}
