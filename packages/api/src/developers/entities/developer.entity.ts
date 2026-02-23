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
export class Developer {
  @ApiProperty({
    description: 'Уникальный идентификатор разработчика',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Полное название разработчика',
    example: 'Larian Studios',
  })
  @Column()
  fullName: string;

  @ApiPropertyOptional({
    description: 'URL логотипа разработчика',
    example: '/uploads/developers/1640995200000-logo.jpg',
  })
  @Column({ nullable: true, type: 'text' })
  photo: string | null;

  @ApiPropertyOptional({
    description: 'Комментарий к разработчику',
    example: 'Бельгийская студия-разработчик видеоигр',
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
    description: 'Игры разработчика',
    type: () => [Game],
  })
  @ManyToMany(() => Game, (game) => game.developers)
  games: Game[];
}
