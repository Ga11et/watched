# Документация для агентов

## Правила проекта

- Перед изменениями в `packages/client/` прочитайте [правило проверки фронтенда](docs/rules/frontend-verification.md).

## Production

- Локальная runtime-конфигурация API и БД: скопируйте `.env.production.api.example` в
  `.env.production.api.local`, заполните `POSTGRES_PASSWORD` и `JWT_SECRET`.
  Для клиента скопируйте `.env.production.client.example` в `.env.production.client.local`.
  Храните оба локальных файла вне Git; Compose передаёт их сервисам через `env_file`.
- Первый запуск: `pnpm prod:build`, затем `pnpm prod:migrate` и `pnpm prod:start`.
  Сборка подготавливает образы API, Nuxt и PostgreSQL, не запуская сервисы.
- Фронтенд: `http://127.0.0.1:33000`; прямой API и Swagger: `http://127.0.0.1:33010`.
  Браузер обращается к API напрямую; SSR через `_fetch` использует внутренний адрес `http://api:33010`.
  `CORS_ORIGIN` должен совпадать с origin фронтенда (`http://127.0.0.1:33000`).
- Миграции и запуск используют только локальные образы. `pnpm prod:stop` сохраняет volumes.

## Модули

- При чтении, создании и обновлении задач прочитайте [workflow issue tracker](docs/modules/issue-tracker/workflow.md).
- При triage и изменении меток прочитайте [канонические triage labels](docs/modules/issue-tracker/triage-labels.md).
