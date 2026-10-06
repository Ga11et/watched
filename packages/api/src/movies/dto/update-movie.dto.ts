import { PartialType } from '@nestjs/mapped-types';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsUUID,
  IsBoolean,
  IsArray,
  ArrayUnique,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateMovieDto } from './create-movie.dto';

export class UpdateMovieDto extends PartialType(CreateMovieDto) {
  @ApiPropertyOptional({
    description: 'Название фильма',
    example: 'Интерстеллар',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Жанр фильма',
    example: 'Научная фантастика, Драма',
  })
  @IsString()
  @IsOptional()
  genre?: string;

  @ApiPropertyOptional({
    description: 'ID режиссёров фильма',
    example: [
      '123e4567-e89b-12d3-a456-426614174000',
      '123e4567-e89b-12d3-a456-426614174001',
    ],
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  @IsOptional()
  directorIds?: string[];

  @ApiPropertyOptional({
    description: 'Рейтинг фильма от 0 до 100',
    example: 85,
  })
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({
    description: 'Дата просмотра фильма',
    example: '2024-01-15T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  watchedAt?: string;

  @ApiPropertyOptional({
    description: 'Комментарий к фильму',
    example: 'Отличный сюжет, потрясающая визуализация',
  })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({
    description: 'Год выпуска фильма',
    example: 2014,
  })
  @IsOptional()
  releaseYear?: number;

  @ApiPropertyOptional({
    description: 'Удалить постер',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  removePoster?: boolean;
}
