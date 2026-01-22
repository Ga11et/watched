import { PartialType } from '@nestjs/mapped-types';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
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
  @IsNumber()
  @Min(0.1)
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
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  rating?: number;
}
