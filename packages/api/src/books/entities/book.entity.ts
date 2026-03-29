import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
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
  comment?: string | null;

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
    description: 'Авторы книги',
    type: () => [Author],
  })
  @ManyToMany(() => Author, (author: Author) => author.books)
  @JoinTable({
    name: 'book_authors',
    joinColumn: {
      name: 'bookId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'authorId',
      referencedColumnName: 'id',
    },
  })
  authors: Author[];

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
