import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, ValidateIf } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Отображаемое имя пользователя',
    example: 'New Name',
    minLength: 1,
    maxLength: 255,
  })
  @ValidateIf((dto: UpdateUserDto) => dto.name !== undefined)
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Уникальный username пользователя',
    example: 'newusername',
    nullable: true,
    minLength: 1,
    maxLength: 50,
    pattern: '^[A-Za-z0-9_]+$',
  })
  @IsOptional()
  @IsString()
  username?: string | null;

  @ApiPropertyOptional({
    description: 'Email пользователя',
    example: 'user@example.com',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  email?: string | null;
}
