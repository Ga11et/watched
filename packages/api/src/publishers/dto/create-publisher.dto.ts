import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePublisherDto {
  @ApiProperty({
    description: 'Полное название издателя',
    example: 'CD Projekt',
  })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({
    description: 'Комментарий к издателю',
    example: 'Польская компания-издатель видеоигр',
  })
  @IsString()
  @IsOptional()
  comment?: string;
}
