## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues for this repository (`Ga11et/watched`) via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage uses the default canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Domain docs use a multi-context layout (root `GLOSSARY-MAP.md` that points to context-specific glossaries/ADRs). See `docs/agents/domain.md`.

### Verification

For API changes, run `pnpm --filter api exec tsc --noEmit` and targeted HTTP E2E files with `pnpm --filter api test:e2e --runInBand <test-file>`. E2E suites share and reset `watched_test` (default PostgreSQL port 5434); run them serially against a disposable database. Run `pnpm test` for the full unit/E2E suite.

The client currently lacks `vue-tsc`; `pnpm --filter client build` checks bundling, not Vue types. For isolated API contract edits, typecheck `packages/client/types/api.ts` using the API package's TypeScript compiler.
