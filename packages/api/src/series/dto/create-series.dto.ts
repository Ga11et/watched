import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsDateString,
} from 'class-validator';

export class CreateSeriesDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  genres?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  rating?: number;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  totalSeasons?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  watchedSeasons?: number;

  @IsDateString()
  @IsOptional()
  watchedAt?: string;
}
