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

- Клиент разбирает ошибки только через `parseRequestError` из `packages/client/utils/request-error.ts`.
  Элементы `violations` вне контракта он отбрасывает.
- Формы раскладывают ошибку через `parseFormRequestError` из того же файла: нарушения известных полей
  показываются у полей, нарушения других полей и ошибка без полей — общим сообщением.
