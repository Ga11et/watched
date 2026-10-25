# Документация для агентов

## Правила проекта

- Перед изменениями в `packages/client/` прочитайте [правило проверки фронтенда](docs/rules/frontend-verification.md).
- Перед добавлением или изменением тестов прочитайте [правило тестов](docs/rules/tests.md).
- Перед изменением ответов API об ошибках или их обработки на клиенте прочитайте [правило ошибок API](docs/rules/api-errors.md).
- Перед созданием или переносом файлов в `packages/api/src/` прочитайте [правило структуры модулей API](docs/rules/api-modules.md).

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

## Development

- Скопируйте `.env.development.api.example` в `.env.development.api.local` и
  `.env.development.client.example` в `.env.development.client.local`; оба файла вне Git.
  Runtime-настройки задавайте в `*.local`: они имеют приоритет над пакетными `.env`.
- Dev-БД работает только во время команд: Compose-проект `watched-development`, БД на
  `127.0.0.1:33020` (`compose.development.yml`) без restart-политики.
- Схема dev-БД создаётся только миграциями, `synchronize` выключен. API в любом окружении
  не стартует с неприменёнными миграциями. `pnpm dev` применяет их автоматически;
  `pnpm dev:migrate` запускает только миграции и останавливает БД, если сам её поднял.
- `pnpm dev` собирает отдельные dev-образы с кешем, поднимает БД, API (watch) и Nuxt
  на тех же портах, что production (33010/33000). Адреса выводятся после HTTP-проверок готовности.
  Ctrl+C останавливает весь dev-стек; `pnpm dev:stop` останавливает его из другого терминала.
  Оба способа сохраняют данные БД и uploads.
- Исходники доступны через bind mount: изменения кода подхватываются без пересборки.
  После изменения зависимостей перезапустите `pnpm dev`: образы и тома `node_modules` обновятся.
  Для типов и инструментов IDE на хосте выполните `pnpm install --frozen-lockfile`.
- Dev использует отдельный volume БД: данные старого `docker-compose.yml` автоматически
  не переносятся; старые контейнеры и volumes сохраняются.

## Тесты

- `pnpm test:api:e2e [-- <путь к spec>]` запускает API-тесты в контейнере и поднимает
  эфемерную test-БД (`compose.test.yml`, данные в tmpfs, порт на хост не публикуется).
  После прогона тестовое окружение удаляется; dev-БД не используется.
  `pnpm --filter api test:e2e` напрямую не поднимает БД.

## Модули

- При чтении, создании и обновлении задач прочитайте [workflow issue tracker](docs/modules/issue-tracker/workflow.md).
- При triage и изменении меток прочитайте [канонические triage labels](docs/modules/issue-tracker/triage-labels.md).
