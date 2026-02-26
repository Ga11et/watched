import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'user_series' })
export class UserSeries {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  seriesId: string;

  @Column({ type: 'int', nullable: true })
  rating: number | null;

  @Column({ type: 'bigint', nullable: true })
  watchedAt: string | null;

  @Column({ type: 'int', nullable: true })
  seasonsWatched: number | null;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
