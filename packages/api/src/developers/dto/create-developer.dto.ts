import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDeveloperDto {
  @ApiProperty({
    description: 'Полное название разработчика',
    example: 'Larian Studios',
  })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({
    description: 'Комментарий к разработчику',
    example: 'Бельгийская студия-разработчик видеоигр',
  })
  @IsString()
  @IsOptional()
  comment?: string;
}
