import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAuthorDto {
  @ApiProperty({
    description: 'Полное имя автора',
    example: 'Лев Толстой',
  })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({
    description: 'Комментарий к автору',
    example: 'Русский писатель, мыслитель и общественный деятель',
  })
  @IsString()
  @IsOptional()
  comment?: string;
}
