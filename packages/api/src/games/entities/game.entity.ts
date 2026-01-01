import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'date' })
  completionDate: Date | null;

  @Column({ nullable: true, type: 'real' })
  playTimeHours: number | null;

  @Column({ nullable: true, type: 'text' })
  comment: string | null;

  @Column({ nullable: true, type: 'int' })
  rating: number | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
