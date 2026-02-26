import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Movie } from '../../movies/entities/movie.entity';

@Entity()
export class Director {
  @ApiProperty({
    description: 'Уникальный идентификатор режиссера',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Полное имя режиссера',
    example: 'Квентин Тарантино',
  })
  @Column()
  fullName: string;

  @ApiPropertyOptional({
    description: 'URL фотографии режиссера',
    example: '/uploads/directors/1640995200000-photo.jpg',
  })
  @Column({ nullable: true, type: 'text' })
  photo: string | null;

  @ApiPropertyOptional({
    description: 'Комментарий к режиссеру',
    example: 'Американский кинорежиссер, сценарист, продюсер и актер',
  })
  @Column({ nullable: true, type: 'text' })
  comment: string | null;

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

  @ApiPropertyOptional({
    description: 'Фильмы режиссера (many-to-many)',
    type: () => [Movie],
  })
  @ManyToMany(() => Movie, (movie) => movie.directors)
  moviesManyToMany: Movie[];
}
