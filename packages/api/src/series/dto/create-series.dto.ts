import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateSeriesDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  genres?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsOptional()
  rating?: number;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsOptional()
  totalSeasons?: number;

  @IsOptional()
  watchedSeasons?: number;

  @IsDateString()
  @IsOptional()
  watchedAt?: string;
}
