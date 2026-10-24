# Ошибки API

Правило действует для ответов API об ошибках в `packages/api/` и их обработки в `packages/client/`.

## Контракт

Ответ с ошибкой имеет тело `{ status, message, violations }`:

- `status` совпадает с HTTP-статусом ответа.
- `message` — непустая строка с общим текстом ошибки.
- `violations` — ошибки конкретных полей: каждый элемент `{ field, error }` со строковыми значениями.
- Ошибка без поля (401, 403, 404, 409, 500 и другие) приходит с `violations: []`, её текст — только в `message`.

```json
{
  "status": 422,
  "message": "Username already exists",
  "violations": [{ "field": "username", "error": "Username already exists" }]
}
```

## Клиент

- Новый код разбирает ошибки только через `parseRequestError` из `packages/client/utils/request-error.ts`.
  Элементы `violations` вне контракта он отбрасывает, поэтому ошибки полей из модулей с другим форматом
  в формах не появятся.
- `getApiErrorStatus` и `getApiErrorMessage` устарели и остаются для ещё не переведённого кода.

## Известные отклонения

Приводите к контракту, когда меняете соответствующий код:

- `ApiExceptionFilter` (`packages/api/src/auth/api-exception.filter.ts`) для ошибок без поля добавляет
  `{ property: 'request', error }` вместо `violations: []`.
- Сервисы каталога (`authors`, `books`, `directors`, `developers`, `games`, `movies`, `publishers`,
  `series`, `user-lists`) возвращают нарушения `{ field, message }` вместо `{ field, error }`.
