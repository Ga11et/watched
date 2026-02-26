import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'user_games' })
export class UserGame {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  gameId: string;

  @Column({ type: 'int', nullable: true })
  rating: number | null;

  @Column({ type: 'real', nullable: true })
  playedHours: number | null;

  @Column({ type: 'bigint', nullable: true })
  playedAt: string | null;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
