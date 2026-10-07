# Issue tracker

- **Система:** GitHub Issues.
- **Репозиторий:** `Ga11et/watched`.
- **Основной CLI:** `gh`.
- **PRs as a request surface:** `false` — pull requests не входят в поток входящих задач для triage.

## Работа с задачами

Все задачи проекта ведутся в GitHub Issues этого репозитория. GitHub — источник истины
для состояния задач и истории обсуждений.

- Читайте открытые задачи через `gh issue list` и `gh issue view <number>`.
- Создавайте задачи через `gh issue create`.
- Обновляйте контекст комментариями через `gh issue comment`.
- Обновляйте статус метками через `gh issue edit --add-label ...`.
  При triage и изменении меток используйте [канонические triage labels](triage-labels.md).

Если сопровождающие проекта решат включить pull requests в поток triage,
значение `PRs as a request surface` нужно изменить на `true`.
