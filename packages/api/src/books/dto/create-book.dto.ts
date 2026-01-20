import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsDateString,
  IsUUID,
} from 'class-validator';

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
   * @min 0
   * @max 100
   * @example 95
   */
  @IsNumber()
  @Min(0)
  @Max(100)
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
   * Количество страниц (опционально)
   * @example 1225
   */
  @IsNumber()
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
   * Год издания (опционально)
   * @min 1800
   * @max 2030
   * @example 1869
   */
  @IsNumber()
  @Min(1800)
  @Max(2030)
  @IsOptional()
  publishYear?: number;
}
