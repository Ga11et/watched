import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity({ name: 'user_movies' })
@Unique('UQ_user_movies_user_movie', ['userId', 'movieId'])
export class UserMovie {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  movieId: string;

  @Column({ type: 'int', nullable: true })
  rating: number | null;

  @Column({ type: 'timestamp', nullable: true })
  watchedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
