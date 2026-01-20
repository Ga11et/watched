import { IsString, IsOptional } from 'class-validator';

/**
 * DTO для создания нового автора
 * @description Используется для валидации данных при создании автора через API
 * @endpoint POST /authors
 */
export class CreateAuthorDto {
  /**
   * Полное имя автора (обязательное поле)
   * @example "Лев Толстой"
   */
  @IsString()
  fullName: string;

  /**
   * Комментарий к автору (опционально)
   * @example "Русский писатель, мыслитель и общественный деятель"
   */
  @IsString()
  @IsOptional()
  comment?: string;
}
