// Внутренний путь приложения: начинается с `/`, но не с `//`, без `\` и управляющих символов.
// Браузер удаляет из URL `\t`, `\n`, `\r` и трактует `\` как `/`, поэтому такие значения
// могут превратиться в адрес другого сайта.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/

export const safeRedirectTo = (target: unknown, fallback: string): string =>
  typeof target === 'string' &&
  target.startsWith('/') &&
  !target.startsWith('//') &&
  !target.includes('\\') &&
  !CONTROL_CHARACTERS.test(target)
    ? target
    : fallback
