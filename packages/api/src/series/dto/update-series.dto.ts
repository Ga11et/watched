import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsDateString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateSeriesDto } from './create-series.dto';

export class UpdateSeriesDto extends PartialType(CreateSeriesDto) {
  @ApiPropertyOptional({
    description: 'Название сериала',
    example: 'Во все тяжкие',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Жанры сериала',
    example: 'Криминал, Драма, Триллер',
  })
  @IsString()
  @IsOptional()
  genres?: string;

  @ApiPropertyOptional({
    description: 'Страна производства',
    example: 'США',
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({
    description: 'Рейтинг сериала от 0 до 10',
    example: 9.5,
  })
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({
    description: 'Комментарий к сериалу',
    example: 'Один из лучших сериалов всех времен',
  })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({
    description: 'Общее количество сезонов',
    example: 5,
  })
  @IsOptional()
  totalSeasons?: number;

  @ApiPropertyOptional({
    description: 'Количество просмотренных сезонов',
    example: 5,
  })
  @IsOptional()
  watchedSeasons?: number;

  @ApiPropertyOptional({
    description: 'Дата просмотра сериала',
    example: '2024-01-15T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  watchedAt?: string;

  @ApiPropertyOptional({
    description: 'Удалить постер',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  removePoster?: boolean;
}
