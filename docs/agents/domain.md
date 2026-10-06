# Domain Docs

## Layout

This repository uses a **multi-context** domain-doc layout.

- Root map: `GLOSSARY-MAP.md`
- Context glossaries: paths listed by `GLOSSARY-MAP.md` (for example per package/app)
- ADR directories: per-context ADR directories listed by `GLOSSARY-MAP.md` (and optional root `docs/adr/` for cross-cutting decisions)

## Consumer Rules (for agents)

1. Start by identifying the active context from the files being changed.
2. Read `GLOSSARY-MAP.md` first to resolve the correct glossary and ADR locations for that context.
3. Read the resolved context glossary before proposing naming/modeling changes.
4. Read relevant ADRs in that context before design or architecture changes.
5. If a change spans multiple contexts, read all relevant context glossaries/ADRs plus any root cross-cutting ADRs.
6. If a needed term/decision is missing, propose an update to the relevant glossary or a new ADR in the correct context.
