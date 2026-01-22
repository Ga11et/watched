import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity()
export class Series {
  @ApiProperty({
    description: 'Уникальный идентификатор сериала',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Название сериала',
    example: 'Во все тяжкие',
  })
  @Column()
  title: string;

  @ApiPropertyOptional({
    description: 'Жанры сериала',
    example: 'Криминал, Драма, Триллер',
  })
  @Column({ nullable: true, type: 'text' })
  genres: string | null;

  @ApiPropertyOptional({
    description: 'Страна производства',
    example: 'США',
  })
  @Column({ nullable: true, type: 'text' })
  country: string | null;

  @ApiPropertyOptional({
    description: 'Рейтинг сериала от 0 до 10',
    example: 9.5,
  })
  @Column({ nullable: true, type: 'decimal', precision: 5, scale: 2 })
  rating: number | null;

  @ApiPropertyOptional({
    description: 'Комментарий к сериалу',
    example: 'Один из лучших сериалов всех времен',
  })
  @Column({ nullable: true, type: 'text' })
  comment: string | null;

  @ApiPropertyOptional({
    description: 'Общее количество сезонов',
    example: 5,
  })
  @Column({ nullable: true, type: 'int' })
  totalSeasons: number | null;

  @ApiPropertyOptional({
    description: 'Количество просмотренных сезонов',
    example: 5,
  })
  @Column({ nullable: true, type: 'int' })
  watchedSeasons: number | null;

  @ApiPropertyOptional({
    description: 'Дата просмотра сериала',
    example: '2024-01-15T00:00:00.000Z',
  })
  @Column({ nullable: true, type: 'timestamp' })
  watchedAt: Date | null;

  @ApiPropertyOptional({
    description: 'Постер сериала',
    example: '/uploads/series/1640995200000-poster.jpg',
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
