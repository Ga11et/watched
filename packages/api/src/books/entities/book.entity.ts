import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Author } from '../../authors/entities/author.entity';

@Entity()
export class Book {
  @ApiProperty({
    description: 'Уникальный идентификатор книги',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Название книги',
    example: 'Война и мир',
  })
  @Column()
  title: string;

  @ApiPropertyOptional({
    description: 'Жанр книги',
    example: 'Роман, Исторический роман',
  })
  @Column({ nullable: true, type: 'text' })
  genre: string | null;

  @ApiPropertyOptional({
    description: 'Рейтинг книги от 0 до 100',
    example: 95,
  })
  @Column({ nullable: true, type: 'int' })
  rating: number | null;

  @ApiPropertyOptional({
    description: 'Дата прочтения книги',
    example: '2024-01-15T00:00:00.000Z',
  })
  @Column({ nullable: true, type: 'timestamp' })
  readAt: Date | null;

  @ApiPropertyOptional({
    description: 'Количество страниц',
    example: 1225,
  })
  @Column({ nullable: true, type: 'int' })
  pageCount: number | null;

  @ApiPropertyOptional({
    description: 'Комментарий к книге',
    example: 'Величайшее произведение русской литературы',
  })
  @Column({ nullable: true, type: 'text' })
  comment: string | null;

  @ApiPropertyOptional({
    description: 'Год издания',
    example: 1869,
  })
  @Column({ nullable: true, type: 'int' })
  publishYear: number | null;

  @ApiPropertyOptional({
    description: 'Обложка книги',
    example: '/uploads/books/1640995200000-cover.jpg',
  })
  @Column({ nullable: true, type: 'text' })
  cover: string | null;

  @ApiPropertyOptional({
    description: 'Автор книги',
    type: () => Author,
  })
  @ManyToOne(() => Author, (author) => author.books, { nullable: true })
  @JoinColumn({ name: 'authorId' })
  author: Author | null;

  @ApiPropertyOptional({
    description: 'ID автора',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ nullable: true, type: 'uuid' })
  authorId: string | null;

  @ApiProperty({
    description: 'Дата создания записи',
    example: '2026-01-22T17:00:00Z',
  })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ApiProperty({
    description: 'Дата обновления записи',
    example: '2026-01-22T17:00:00Z',
  })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
