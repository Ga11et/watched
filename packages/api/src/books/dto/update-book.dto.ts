import { Transform } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsArray,
  ArrayUnique,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBookDto {
  @ApiPropertyOptional({
    description: 'Название книги',
    example: 'Война и мир',
  })
  @IsString()
  @IsOptional()
  title?: string;

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
    description: 'Год издания',
    example: 1869,
  })
  @IsOptional()
  publishYear?: number;

  @ApiPropertyOptional({
    description: 'Удалить обложку',
    example: false,
  })
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return typeof value === 'boolean' ? value : undefined;
  })
  @IsOptional()
  removeCover?: boolean;
}
