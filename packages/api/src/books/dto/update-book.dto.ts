import { Transform } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsUUID,
  IsBoolean,
} from 'class-validator';

// Custom decorator for number fields that accepts both string and number (for FormData)

/**
 * DTO для обновления книги
 * @description Используется для валидации данных при обновлении книги через API
 * @endpoint PUT /books/:id
 */
export class UpdateBookDto {
  /**
   * Название книги (опционально)
   * @example "Война и мир"
   */
  @IsString()
  @IsOptional()
  title?: string;

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
   * @description Пользовательская оценка книги. Может быть передано как число или строка (для FormData)
   * @min 0
   * @max 100
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
   * Год издания (опционально)
   * @description Может быть передано как число или строка (для FormData)
   * @example 1869
   */
  @IsOptional()
  publishYear?: number;

  /**
   * Удалить обложку (опционально)
   * @description Флаг для удаления текущей обложки книги
   * @example false
   */
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return typeof value === 'boolean' ? value : undefined;
  })
  @IsOptional()
  removeCover?: boolean;
}
