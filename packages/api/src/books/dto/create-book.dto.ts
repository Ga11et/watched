import {
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  ArrayUnique,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookDto {
  @ApiProperty({
    description: 'Название книги',
    example: 'Война и мир',
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'Список ID авторов',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    type: [String],
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  @IsOptional()
  authorIds?: string[];

  @ApiPropertyOptional({
    description: 'Жанр книги',
    example: 'Роман, Исторический роман',
  })
  @IsString()
  @IsOptional()
  genre?: string;

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
    description: 'Обложка книги',
    example: '/uploads/books/1640995200000-cover.jpg',
  })
  @IsString()
  @IsOptional()
  cover?: string;
}
