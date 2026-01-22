import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateDirectorDto } from './create-director.dto';

export class UpdateDirectorDto extends PartialType(CreateDirectorDto) {
  @ApiPropertyOptional({
    description: 'Полное имя режиссера',
    example: 'Квентин Тарантино',
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Комментарий к режиссеру',
    example: 'Американский кинорежиссер, сценарист, продюсер и актер',
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
