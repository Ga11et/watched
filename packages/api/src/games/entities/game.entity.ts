import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('date')
  completionDate: Date;

  @Column('decimal', { precision: 5, scale: 1 })
  playTimeHours: number;

  @Column('text', { nullable: true })
  comment: string;

  @Column('int', { nullable: true })
  rating: number; // 1-100 scale

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
