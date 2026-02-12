import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity()
export class Game {
  @ApiProperty({
    description: 'Уникальный идентификатор игры',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Название игры',
    example: 'The Witcher 3: Wild Hunt',
  })
  @Column()
  title: string;

  @ApiPropertyOptional({
    description: 'Дата прохождения игры',
    example: '2024-01-15',
  })
  @Column({ nullable: true, type: 'date' })
  completionDate: Date | null;

  @ApiPropertyOptional({
    description: 'Время игры в часах',
    example: 125.5,
  })
  @Column({ nullable: true, type: 'real' })
  playTimeHours: number | null;

  @ApiPropertyOptional({
    description: 'Комментарий к игре',
    example: 'Отличная RPG с глубоким сюжетом',
  })
  @Column({ nullable: true, type: 'text' })
  comment: string | null;

  @ApiPropertyOptional({
    description: 'Рейтинг игры от 1 до 100',
    example: 95,
  })
  @Column({ nullable: true, type: 'int' })
  rating: number | null;

  @ApiPropertyOptional({
    description: 'Обложка игры',
    example: '/uploads/games/1640995200000-cover.jpg',
  })
  @Column({ nullable: true, type: 'text' })
  cover: string | null;

  @ApiProperty({
    description: 'Дата создания записи',
    example: '2026-01-22T17:00:00Z',
  })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ApiProperty({
    description: 'Дата обновления записи',
    example: '2026-01-22T17:00:00Z',
  })
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
