import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Book } from '../../books/entities/book.entity';

@Entity()
export class Author {
  @ApiProperty({
    description: 'Уникальный идентификатор автора',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Полное имя автора',
    example: 'Лев Толстой',
  })
  @Column()
  fullName: string;

  @ApiPropertyOptional({
    description: 'URL фотографии автора',
    example: '/uploads/authors/1640995200000-photo.jpg',
  })
  @Column({ nullable: true, type: 'text' })
  photo: string | null;

  @ApiPropertyOptional({
    description: 'Комментарий к автору',
    example: 'Русский писатель, мыслитель и общественный деятель',
  })
  @Column({ nullable: true, type: 'text' })
  comment: string | null;

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

  @ApiPropertyOptional({
    description: 'Книги автора',
    type: () => [Book],
  })
  @OneToMany(() => Book, (book) => book.author)
  books: Book[];

  @ApiPropertyOptional({
    description: 'Книги автора (many-to-many)',
    type: () => [Book],
  })
  @ManyToMany(() => Book, (book) => book.authors)
  booksManyToMany: Book[];
}
