import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity()
export class Movie {
  @ApiProperty({
    description: 'Уникальный идентификатор фильма',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Название фильма',
    example: 'Интерстеллар',
  })
  @Column()
  title: string;

  @ApiPropertyOptional({
    description: 'Жанр фильма',
    example: 'Научная фантастика, Драма',
  })
  @Column({ nullable: true, type: 'text' })
  genre: string | null;

  @ApiPropertyOptional({
    description: 'ID режиссера',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ nullable: true, type: 'uuid' })
  directorId: string | null;

  @ApiPropertyOptional({
    description: 'Рейтинг фильма от 0 до 100',
    example: 85,
  })
  @Column({ nullable: true, type: 'int' })
  rating: number | null;

  @ApiPropertyOptional({
    description: 'Дата просмотра фильма',
    example: '2024-01-15T00:00:00.000Z',
  })
  @Column({ nullable: true, type: 'timestamp' })
  watchedAt: Date | null;

  @ApiPropertyOptional({
    description: 'Комментарий к фильму',
    example: 'Отличный сюжет, потрясающая визуализация',
  })
  @Column({ nullable: true, type: 'text' })
  comment: string | null;

  @ApiPropertyOptional({
    description: 'Год выпуска фильма',
    example: 2014,
  })
  @Column({ nullable: true, type: 'int' })
  releaseYear: number | null;

  @ApiPropertyOptional({
    description: 'Постер фильма',
    example: '/uploads/movies/1640995200000-poster.jpg',
  })
  @Column({ nullable: true, type: 'text' })
  poster: string | null;

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
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
