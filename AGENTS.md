# Документация для агентов

## Правила проекта

- Перед изменениями в `packages/client/` прочитайте [правило проверки фронтенда](docs/rules/frontend-verification.md).

## Production API

- Локальная runtime-конфигурация: скопируйте `.env.production.example` в
  `.env.production.local`, заполните `POSTGRES_PASSWORD` и `JWT_SECRET`. Храните файл локально.
- Первый запуск: `pnpm prod:build`, отдельно `docker pull postgres:16-alpine`,
  затем `pnpm prod:migrate` и `pnpm prod:start`.
- Миграции и запуск используют только локальные образы. `pnpm prod:stop` сохраняет volumes.

## Модули

- При чтении, создании и обновлении задач прочитайте [workflow issue tracker](docs/modules/issue-tracker/workflow.md).
- При triage и изменении меток прочитайте [канонические triage labels](docs/modules/issue-tracker/triage-labels.md).
