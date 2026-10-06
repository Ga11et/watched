# Issue Tracker

- **System**: GitHub Issues
- **Repository**: `Ga11et/watched`
- **Primary CLI**: `gh`
- **PRs as a request surface**: `false`

## How issues are tracked

All work items are tracked as GitHub Issues in this repository.

## Agent workflow

- Read open issues with `gh issue list` / `gh issue view <number>`.
- Create issues with `gh issue create`.
- Update status/context using comments (`gh issue comment`) and labels (`gh issue edit --add-label ...`).
- Treat GitHub as the source of truth for issue state and discussion history.

## Notes

If maintainers later want pull requests included in triage intake, they can flip `PRs as a request surface` to `true`.
