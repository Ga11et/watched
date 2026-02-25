import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST',
}

@Entity()
export class User {
  @ApiProperty({
    description: 'Уникальный идентификатор пользователя',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiPropertyOptional({
    description: 'Уникальный username пользователя',
    example: 'testuser',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true, unique: true })
  username: string | null;

  @ApiPropertyOptional({
    description: 'Уникальный email пользователя',
    example: 'test@example.com',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true, unique: true })
  email: string | null;

  @ApiProperty({
    description: 'Хеш пароля пользователя',
    example: '$2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  })
  @Column({ type: 'text' })
  passwordHash: string;

  @ApiProperty({
    description: 'Отображаемое имя пользователя',
    example: 'Test User',
  })
  @Column({ type: 'text' })
  name: string;

  @ApiProperty({
    description: 'Роль пользователя',
    enum: UserRole,
    example: UserRole.USER,
  })
  @Column({ type: 'varchar', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @ApiProperty({
    description: 'Признак активности пользователя',
    example: true,
  })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Дата создания пользователя',
    example: '2026-01-22T17:00:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Дата обновления пользователя',
    example: '2026-01-22T17:00:00Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
