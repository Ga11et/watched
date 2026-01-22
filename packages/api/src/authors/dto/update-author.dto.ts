import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateAuthorDto } from './create-author.dto';

export class UpdateAuthorDto extends PartialType(CreateAuthorDto) {
  @ApiPropertyOptional({
    description: 'Полное имя автора',
    example: 'Лев Толстой',
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Комментарий к автору',
    example: 'Русский писатель, мыслитель и общественный деятель',
  })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({
    description: 'Удалить фотографию',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  removePhoto?: boolean;
}
