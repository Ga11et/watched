import {
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  ArrayUnique,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMovieDto {
  @ApiProperty({
    description: 'Название фильма',
    example: 'Интерстеллар',
  })
  @IsString()
  title: string;

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
    description: 'Год выпуска фильма',
    example: 2014,
  })
  @IsOptional()
  releaseYear?: number;
}
