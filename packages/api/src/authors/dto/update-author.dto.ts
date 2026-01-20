import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { CreateAuthorDto } from './create-author.dto';

/**
 * DTO для обновления автора
 * @description Используется для валидации данных при обновлении автора через API
 * @endpoint PUT /authors/:id
 */
export class UpdateAuthorDto extends PartialType(CreateAuthorDto) {
  /**
   * Удалить фотографию (опционально)
   * @description Флаг для удаления текущей фотографии автора
   * @example false
   */
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return typeof value === 'boolean' ? value : undefined;
  })
  removePhoto?: boolean;
}
