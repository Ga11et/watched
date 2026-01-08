import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Movie {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  genre: string | null;

  @Column({ nullable: true, type: 'uuid' })
  directorId: string | null;

  @Column({ nullable: true, type: 'int' })
  rating: number | null;

  @Column({ nullable: true, type: 'timestamp' })
  watchedAt: Date | null;

  @Column({ nullable: true, type: 'text' })
  comment: string | null;

  @Column({ nullable: true, type: 'int' })
  releaseYear: number | null;

  @Column({ nullable: true, type: 'text' })
  poster: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
