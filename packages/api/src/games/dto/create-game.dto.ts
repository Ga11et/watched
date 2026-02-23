import {
  IsString,
  IsDateString,
  IsOptional,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

const toStringArray = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (value === '') {
    return [];
  }

  const isPrimitive = (item: unknown): item is string | number | boolean => {
    return (
      typeof item === 'string' ||
      typeof item === 'number' ||
      typeof item === 'boolean'
    );
  };

  if (Array.isArray(value)) {
    return value.filter(isPrimitive).map((item) => String(item));
  }

  if (isPrimitive(value)) {
    return [String(value)];
  }

  return undefined;
};

export class CreateGameDto {
  @ApiProperty({
    description: 'Название игры',
    example: 'The Witcher 3: Wild Hunt',
  })
  @IsString()
  title: string;

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
  })
  @IsOptional()
  playTimeHours?: number;

  @ApiPropertyOptional({
    description: 'Комментарий к игре',
    example: 'Отличная RPG с глубоким сюжетом',
  })
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({
    description: 'Рейтинг игры от 1 до 100',
    example: 95,
  })
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({
    description: 'Обложка игры',
    example: '/uploads/games/1640995200000-cover.jpg',
  })
  @IsOptional()
  cover?: string;

  @ApiPropertyOptional({
    description: 'Список ID издателей',
    type: [String],
    example: [
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
    ],
  })
  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
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
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @IsUUID('4', { each: true })
  developerIds?: string[];
}
