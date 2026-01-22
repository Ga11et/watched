import { IsString, IsOptional, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookDto {
  @ApiProperty({
    description: 'Название книги',
    example: 'Война и мир',
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'ID автора',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  authorId?: string;

  @ApiPropertyOptional({
    description: 'Жанр книги',
    example: 'Роман, Исторический роман',
  })
  @IsString()
  @IsOptional()
  genre?: string;

  @ApiPropertyOptional({
    description: 'Рейтинг книги от 0 до 100',
    example: 95,
  })
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({
    description: 'Дата прочтения книги',
    example: '2024-01-15T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  readAt?: string;

  @ApiPropertyOptional({
    description: 'Год издания',
    example: 1869,
  })
  @IsOptional()
  publishYear?: number;

  @ApiPropertyOptional({
    description: 'Количество страниц',
    example: 1225,
  })
  @IsOptional()
  pageCount?: number;

  @ApiPropertyOptional({
    description: 'Комментарий к книге',
    example: 'Величайшее произведение русской литературы',
  })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({
    description: 'Обложка книги',
    example: '/uploads/books/1640995200000-cover.jpg',
  })
  @IsString()
  @IsOptional()
  cover?: string;
}
