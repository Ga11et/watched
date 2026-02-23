import { PartialType } from '@nestjs/mapped-types';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { CreateGameDto } from './create-game.dto';

export class UpdateGameDto extends PartialType(CreateGameDto) {
  @ApiPropertyOptional({
    description: 'Название игры',
    example: 'The Witcher 3: Wild Hunt',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Дата прохождения игры',
    example: '2024-01-15',
  })
  @IsDateString()
  @IsOptional()
  completionDate?: string;

  @ApiPropertyOptional({
    description: 'Время игры в часах',
    example: 125.5,
    minimum: 0.1,
  })
  @IsOptional()
  playTimeHours?: number;

  @ApiPropertyOptional({
    description: 'Комментарий к игре',
    example: 'Отличная RPG с глубоким сюжетом',
  })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({
    description: 'Рейтинг игры от 1 до 100',
    example: 95,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  rating?: number;

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

  @ApiPropertyOptional({
    description: 'Список ID издателей',
    type: [String],
    example: [
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  publisherIds?: string[];

  @ApiPropertyOptional({
    description: 'Список ID разработчиков',
    type: [String],
    example: [
      '550e8400-e29b-41d4-a716-446655440003',
      '550e8400-e29b-41d4-a716-446655440004',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  developerIds?: string[];
}
