import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Game } from '../../games/entities/game.entity';

@Entity()
export class Publisher {
  @ApiProperty({
    description: 'Уникальный идентификатор издателя',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Полное название издателя',
    example: 'CD Projekt',
  })
  @Column()
  fullName: string;

  @ApiPropertyOptional({
    description: 'URL логотипа издателя',
    example: '/uploads/publishers/1640995200000-logo.jpg',
  })
  @Column({ nullable: true, type: 'text' })
  photo: string | null;

  @ApiPropertyOptional({
    description: 'Комментарий к издателю',
    example: 'Польская компания-издатель видеоигр',
  })
  @Column({ nullable: true, type: 'text' })
  comment: string | null;

  @ApiProperty({
    description: 'Дата создания записи',
    example: '2026-01-22T17:00:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Дата обновления записи',
    example: '2026-01-22T17:00:00Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Игры издателя',
    type: () => [Game],
  })
  @ManyToMany(() => Game, (game) => game.publishers)
  games: Game[];
}
