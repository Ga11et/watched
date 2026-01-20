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

  /** Полное имя автора (обязательное поле) */
  @Column()
  fullName: string;

  /** URL фотографии автора (опционально) */
  @Column({ nullable: true, type: 'text' })
  photo: string | null;

  /** Комментарий к автору (опционально) */
  @Column({ nullable: true, type: 'text' })
  comment: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  /**
   * Книги автора
   * @relation Обратная связь с таблицей books
   */
  @OneToMany(() => Book, (book) => book.author)
  books: Book[];
}
