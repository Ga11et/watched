import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Movie } from '../../movies/entities/movie.entity';

@Entity({ name: 'user_movies' })
@Unique('UQ_user_movies_user_movie', ['userId', 'movieId'])
export class UserMovie {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ format: 'uuid' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiHideProperty()
  @Column({ type: 'uuid' })
  movieId: string;

  @ApiProperty({ type: () => Movie })
  @ManyToOne(() => Movie, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'movieId' })
  movie: Movie;

  @ApiProperty({ type: Number, nullable: true, minimum: 0, maximum: 100 })
  @Column({ type: 'int', nullable: true })
  rating: number | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  watchedAt: Date | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  @UpdateDateColumn()
  updatedAt: Date;
}
