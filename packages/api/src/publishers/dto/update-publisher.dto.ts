import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { CreatePublisherDto } from './create-publisher.dto';

export class UpdatePublisherDto extends PartialType(CreatePublisherDto) {
  @ApiPropertyOptional({
    description: 'Полное название издателя',
    example: 'CD Projekt',
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Комментарий к издателю',
    example: 'Польская компания-издатель видеоигр',
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
