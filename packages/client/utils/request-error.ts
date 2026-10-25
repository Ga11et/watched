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

/** @deprecated Используйте `parseRequestError(error).statusCode`. */
export const getApiErrorStatus = (error: unknown): number | null => {
  if (!error || typeof error !== 'object') {
    return null
  }

  const withStatus = error as {
    status?: number
    statusCode?: number
    response?: { status?: number }
  }
  const status = withStatus.status ?? withStatus.statusCode ?? withStatus.response?.status

  return typeof status === 'number' ? status : null
}

/** @deprecated Используйте `parseRequestError(error).message`. */
export const getApiErrorMessage = (error: unknown): string => {
  const fallback = 'Не удалось выполнить запрос. Попробуйте еще раз.'

  if (!error || typeof error !== 'object') {
    return fallback
  }

  const withData = error as { data?: { message?: string | string[] } }
  const message = withData.data?.message

  if (Array.isArray(message) && message.length > 0) {
    return String(message[0])
  }

  if (typeof message === 'string' && message.trim().length > 0) {
    return message
  }

  return fallback
}
