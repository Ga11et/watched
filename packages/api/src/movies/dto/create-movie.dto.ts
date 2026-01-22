import { IsString, IsOptional, IsDateString, IsUUID } from 'class-validator';

/**
 * DTO для создания нового фильма
 * @description Используется для валидации данных при создании фильма через API
 * @endpoint POST /movies
 */
export class CreateMovieDto {
  /**
   * Название фильма (обязательное поле)
   * @example "Интерстеллар"
   */
  @IsString()
  title: string;

  /**
   * Жанр фильма (опционально)
   * @example "Научная фантастика, Драма"
   */
  @IsString()
  @IsOptional()
  genre?: string;

  /**
   * UUID режиссёра (опционально)
   * @description Внешний ключ к таблице directors
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @IsUUID()
  @IsOptional()
  directorId?: string;

  /**
   * Рейтинг фильма от 0 до 100 (опционально)
   * @description Пользовательская оценка фильма
   * @example 85
   */
  @IsOptional()
  rating?: number;

  /**
   * Дата просмотра фильма (опционально)
   * @description Когда фильм был просмотрен
   * @format ISO 8601
   * @example "2024-01-15T00:00:00.000Z"
   */
  @IsDateString()
  @IsOptional()
  watchedAt?: string;

  /**
   * Комментарий к фильму (опционально)
   * @description Личные заметки о фильме
   * @example "Отличный сюжет, потрясающая визуализация"
   */
  @IsString()
  @IsOptional()
  comment?: string;

  /**
   * Год выпуска фильма (опционально)
   * @description Год выхода фильма в прокат
   * @example 2014
   */
  @IsOptional()
  releaseYear?: number;
}
