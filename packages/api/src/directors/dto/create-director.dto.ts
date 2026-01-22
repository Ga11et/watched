import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDirectorDto {
  @ApiProperty({
    description: 'Полное имя режиссера',
    example: 'Квентин Тарантино',
  })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({
    description: 'Комментарий к режиссеру',
    example: 'Американский кинорежиссер, сценарист, продюсер и актер',
  })
  @IsString()
  @IsOptional()
  comment?: string;
}
