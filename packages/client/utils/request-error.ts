export interface RequestViolation {
  field: string
  error: string
}

/**
 * Ошибка запроса к API по контракту `{ status, message, violations }`: `violations` описывают
 * только ошибки полей, ошибка без поля приходит с пустым `violations`. Модули бэкенда с другим
 * форматом нужно исправлять под этот контракт, см. docs/rules/api-errors.md.
 */
export interface RequestError {
  /** HTTP-статус ответа; `null`, если ответа нет. */
  statusCode: number | null
  message: string
  violations: RequestViolation[]
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
  const violations = Array.isArray(body.violations)
    ? body.violations.filter(
        (violation: { field?: unknown; error?: unknown } | null): violation is RequestViolation =>
          typeof violation?.field === 'string' && typeof violation?.error === 'string',
      )
    : []

  return { statusCode, message, violations }
}

export interface FormRequestError {
  message: string
  fieldErrors: Record<string, string>
}

// Нарушения известных полей показываются у полей, остальные и ошибка без полей — общим сообщением.
export const parseFormRequestError = (
  error: unknown,
  fields: readonly string[],
): FormRequestError => {
  const { message, violations } = parseRequestError(error)
  const fieldErrors: Record<string, string> = {}
  let generalMessage = ''

  for (const { field, error: text } of violations) {
    if (fields.includes(field)) {
      fieldErrors[field] ??= text
    } else {
      generalMessage ||= text
    }
  }

  return {
    message: generalMessage || (Object.keys(fieldErrors).length > 0 ? '' : message),
    fieldErrors,
  }
}
