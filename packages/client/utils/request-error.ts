/**
 * Ошибка запроса к API по контракту `{ status, message, violations }`: `violations` описывают
 * только ошибки полей, ошибка без поля приходит с пустым `violations`. Модули бэкенда с другим
 * форматом нужно исправлять под этот контракт, см. docs/rules/api-errors.md.
 */
export interface RequestError {
  /** HTTP-статус ответа; `null`, если ответа нет. */
  statusCode: number | null
  message: string
  violations: Record<string, string>
}

// Тело ответа 5xx не читается, чтобы внутренние детали ошибки не попадали в интерфейс.
export const parseRequestError = (error: unknown): RequestError => {
  const fetchError = (error ?? {}) as { statusCode?: unknown; data?: unknown }
  const statusCode = typeof fetchError.statusCode === 'number' ? fetchError.statusCode : null
  const body = (statusCode !== null && statusCode < 500 ? (fetchError.data ?? {}) : {}) as {
    message?: unknown
    violations?: unknown
  }
  const message =
    typeof body.message === 'string' && body.message.trim()
      ? body.message
      : 'Не удалось выполнить запрос. Попробуйте еще раз.'
  const violations =
    body.violations !== null &&
    typeof body.violations === 'object' &&
    !Array.isArray(body.violations)
      ? Object.fromEntries(
          Object.entries(body.violations).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string',
          ),
        )
      : {}

  return { statusCode, message, violations }
}
