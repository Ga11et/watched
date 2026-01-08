import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsDateString,
  IsUUID,
} from 'class-validator';

export class CreateMovieDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  genre?: string;

  @IsUUID()
  @IsOptional()
  directorId?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  rating?: number;

  @IsDateString()
  @IsOptional()
  watchedAt?: string;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsNumber()
  @IsOptional()
  releaseYear?: number;
}
