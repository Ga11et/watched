# Документация для агентов

## Правила проекта

- Перед изменениями в `packages/client/` прочитайте [правило проверки фронтенда](docs/rules/frontend-verification.md).
- Перед созданием или переносом хелперов в `packages/client/` прочитайте [правило модулей фронтенда](docs/rules/frontend-modules.md).
- Перед добавлением или изменением тестов прочитайте [правило тестов](docs/rules/tests.md).
- Перед изменением ответов API об ошибках или их обработки на клиенте прочитайте [правило ошибок API](docs/rules/api-errors.md).
- Перед созданием или переносом файлов в `packages/api/src/` прочитайте [правило структуры модулей API](docs/rules/api-modules.md).

## Тесты

- `pnpm test:api:e2e [-- <путь к spec>]` запускает API-тесты в контейнере и поднимает
  эфемерную test-БД (`compose.test.yml`, данные в tmpfs, порт на хост не публикуется).
  После прогона тестовое окружение удаляется; dev-БД не используется.
  `pnpm --filter api test:e2e` напрямую не поднимает БД.

## Модули

- При чтении, создании и обновлении задач прочитайте [workflow issue tracker](docs/modules/issue-tracker/workflow.md).
- При triage и изменении меток прочитайте [канонические triage labels](docs/modules/issue-tracker/triage-labels.md).
