import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

/**
 * DTO для создания нового автора
 * @description Используется для валидации данных при создании автора через API
 * @endpoint POST /authors
 */
export class CreateAuthorDto {
  /**
   * Имя автора (обязательное поле)
   * @example "Лев Толстой"
   */
  @IsString()
  name: string;

  /**
   * Биография автора (опционально)
   * @example "Русский писатель, мыслитель и общественный деятель"
   */
  @IsString()
  @IsOptional()
  bio?: string;

  /**
   * Год рождения автора (опционально)
   * @min 1000
   * @max 2000
   * @example 1828
   */
  @IsNumber()
  @Min(1000)
  @Max(2000)
  @IsOptional()
  birthYear?: number;

  /**
   * Год смерти автора (опционально)
   * @min 1000
   * @max 2024
   * @example 1910
   */
  @IsNumber()
  @Min(1000)
  @Max(2024)
  @IsOptional()
  deathYear?: number;

  /**
   * Страна автора (опционально)
   * @example "Россия"
   */
  @IsString()
  @IsOptional()
  country?: string;

  /**
   * URL фотографии автора (опционально)
   * @example "https://example.com/photos/tolstoy.jpg"
   */
  @IsString()
  @IsOptional()
  photo?: string;
}
