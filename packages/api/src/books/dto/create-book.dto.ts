import { IsString, IsOptional, IsDateString, IsUUID } from 'class-validator';

/**
 * DTO для создания новой книги
 * @description Используется для валидации данных при создании книги через API
 * @endpoint POST /books
 */
export class CreateBookDto {
  /**
   * Название книги (обязательное поле)
   * @example "Война и мир"
   */
  @IsString()
  title: string;

  /**
   * ID автора (опционально)
   * @description Внешний ключ к таблице authors
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @IsUUID()
  @IsOptional()
  authorId?: string;

  /**
   * Жанр книги (опционально)
   * @example "Роман, Исторический роман"
   */
  @IsString()
  @IsOptional()
  genre?: string;

  /**
   * Рейтинг книги от 0 до 100 (опционально)
   * @description Пользовательская оценка книги
   * @example 95
   */
  @IsOptional()
  rating?: number;

  /**
   * Дата прочтения книги (опционально)
   * @description Когда книга была прочитана
   * @format ISO 8601
   * @example "2024-01-15T00:00:00.000Z"
   */
  @IsDateString()
  @IsOptional()
  readAt?: string;

  /**
   * Год издания (опционально)
   * @description Может быть передано как число или строка (для FormData)
   * @example 1869
   */
  @IsOptional()
  publishYear?: number;

  /**
   * Количество страниц (опционально)
   * @description Может быть передано как число или строка (для FormData)
   * @example 1225
   */
  @IsOptional()
  pageCount?: number;

  /**
   * Комментарий к книге (опционально)
   * @description Личные заметки о книге
   * @example "Величайшее произведение русской литературы"
   */
  @IsString()
  @IsOptional()
  comment?: string;

  /**
   * Обложка книги (опционально)
   * @description Путь к файлу обложки, сохраненному на сервере
   * @example "/uploads/books/1640995200000-cover.jpg"
   */
  @IsString()
  @IsOptional()
  cover?: string;
}
