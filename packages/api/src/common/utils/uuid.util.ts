const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Проверяет, является ли строка валидным UUID (v4-совместимый формат).
 */
export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}
