import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinTable,
  ManyToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Director } from '../../directors/entities/director.entity';

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

  @ApiProperty({
    description: 'Жанр фильма',
    example: 'Научная фантастика, Драма',
    type: String,
    nullable: true,
  })
  @Column({ nullable: true, type: 'text' })
  genre: string | null;

  @ApiProperty({
    description: 'Год выпуска фильма',
    example: 2014,
    type: Number,
    nullable: true,
  })
  @Column({ nullable: true, type: 'int' })
  releaseYear: number | null;

  @ApiProperty({
    description: 'Постер фильма',
    example: '/uploads/movies/1640995200000-poster.jpg',
    type: String,
    nullable: true,
  })
  @Column({ nullable: true, type: 'text' })
  poster: string | null;

  @ApiProperty({
    description: 'Режиссеры фильма',
    type: () => [Director],
  })
  @ManyToMany(() => Director, (director: Director) => director.moviesManyToMany)
  @JoinTable({
    name: 'movie_directors',
    joinColumn: {
      name: 'movieId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'directorId',
      referencedColumnName: 'id',
    },
  })
  directors?: Director[];

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
