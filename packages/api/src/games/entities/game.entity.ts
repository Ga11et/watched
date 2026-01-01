import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('date')
  completionDate: Date;

  @Column('decimal', { precision: 5, scale: 1, nullable: true })
  playTimeHours: number;

  @Column('text', { nullable: true })
  comment: string;

  @Column('int', { nullable: true })
  rating: number; // 1-100 scale

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
