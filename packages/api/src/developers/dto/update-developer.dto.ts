import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { CreateDeveloperDto } from './create-developer.dto';

export class UpdateDeveloperDto extends PartialType(CreateDeveloperDto) {
  @ApiPropertyOptional({
    description: 'Полное название разработчика',
    example: 'Larian Studios',
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Комментарий к разработчику',
    example: 'Бельгийская студия-разработчик видеоигр',
  })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({
    description: 'Удалить логотип',
    example: false,
  })
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return typeof value === 'boolean' ? value : undefined;
  })
  @IsOptional()
  removePhoto?: boolean;
}
