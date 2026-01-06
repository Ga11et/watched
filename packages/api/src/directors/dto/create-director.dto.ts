import { IsString, IsOptional } from 'class-validator';

export class CreateDirectorDto {
  @IsString()
  fullName: string;

  @IsString()
  @IsOptional()
  comment?: string;
}
