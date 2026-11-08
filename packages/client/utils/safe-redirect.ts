// Внутренний путь приложения: начинается с `/`, но не с `//` и без `\`, иначе браузер может
// трактовать его как адрес другого сайта.
export const safeRedirectTo = (target: unknown, fallback: string): string =>
  typeof target === 'string' &&
  target.startsWith('/') &&
  !target.startsWith('//') &&
  !target.includes('\\')
    ? target
    : fallback
