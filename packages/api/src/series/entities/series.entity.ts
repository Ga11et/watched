import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Series {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  genres: string | null;

  @Column({ nullable: true, type: 'text' })
  country: string | null;

  @Column({ nullable: true, type: 'decimal', precision: 5, scale: 2 })
  rating: number | null;

  @Column({ nullable: true, type: 'text' })
  comment: string | null;

  @Column({ nullable: true, type: 'int' })
  totalSeasons: number | null;

  @Column({ nullable: true, type: 'int' })
  watchedSeasons: number | null;

  @Column({ nullable: true, type: 'timestamp' })
  watchedAt: Date | null;

  @Column({ nullable: true, type: 'text' })
  poster: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
