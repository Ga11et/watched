import { IsString, IsDateString, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class CreateGameDto {
  @IsString()
  title: string;

  @IsDateString()
  completionDate: string;

  @IsNumber()
  @Min(0.1)
  @IsOptional()
  playTimeHours?: number;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  rating?: number;
}
