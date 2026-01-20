import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Book } from '../../books/entities/book.entity';

/**
 * Сущность автора в системе отслеживания прочитанного контента
 * @description Основная модель для хранения информации об авторах книг
 */
@Entity()
export class Author {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Имя автора (обязательное поле) */
  @Column()
  name: string;

  /** Биография автора (опционально) */
  @Column({ nullable: true, type: 'text' })
  bio: string | null;

  /** Год рождения автора (опционально) */
  @Column({ nullable: true, type: 'int' })
  birthYear: number | null;

  /** Год смерти автора (опционально) */
  @Column({ nullable: true, type: 'int' })
  deathYear: number | null;

  /** Страна автора (опционально) */
  @Column({ nullable: true, type: 'text' })
  country: string | null;

  /** URL фотографии автора (опционально) */
  @Column({ nullable: true, type: 'text' })
  photo: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  /** Связь с книгами автора */
  @OneToMany(() => Book, (book) => book.author)
  books: Book[];
}
