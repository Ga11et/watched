import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Author } from '../../authors/entities/author.entity';

/**
 * Сущность книги в системе отслеживания прочитанного контента
 * @description Основная модель для хранения информации о книгах
 */
@Entity()
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Название книги (обязательное поле) */
  @Column()
  title: string;

  /** Жанр книги (опционально) */
  @Column({ nullable: true, type: 'text' })
  genre: string | null;

  /**
   * Рейтинг книги от 0 до 100
   * @validation Мин: 0, Макс: 100
   */
  @Column({ nullable: true, type: 'int' })
  rating: number | null;

  /**
   * Дата прочтения книги
   * @format ISO 8601
   */
  @Column({ nullable: true, type: 'timestamp' })
  readAt: Date | null;

  /** Количество страниц (опционально) */
  @Column({ nullable: true, type: 'int' })
  pageCount: number | null;

  /** Комментарий к книге (опционально) */
  @Column({ nullable: true, type: 'text' })
  comment: string | null;

  /** Год издания (опционально) */
  @Column({ nullable: true, type: 'int' })
  publishYear: number | null;

  /** Обложка книги (опционально) */
  @Column({ nullable: true, type: 'text' })
  cover: string | null;

  /**
   * Автор книги (внешний ключ)
   * @relation Связь с таблицей authors
   */
  @ManyToOne(() => Author, (author) => author.books, { nullable: true })
  @JoinColumn({ name: 'authorId' })
  author: Author | null;

  /**
   * ID автора (опционально)
   * @description Внешний ключ к таблице authors
   */
  @Column({ nullable: true, type: 'uuid' })
  authorId: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
