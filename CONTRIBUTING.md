# Contributing to Musonic

Thank you for taking the time to contribute! This document outlines the workflow, conventions, and expectations to keep the project healthy.

---

## Branching Strategy

We follow a two-branch model:

| Branch    | Purpose                                                  |
|-----------|----------------------------------------------------------|
| `main`    | Stable, release-ready code. Only merged from `develop` via a reviewed PR. |
| `develop` | Active development. All feature branches target this branch. |

### Feature / fix branches

Branch off from `develop`, use a short descriptive name:

```
git checkout develop
git checkout -b feat/queue-drag-drop
git checkout -b fix/mini-player-swipe
```

Naming prefixes:

| Prefix   | Use for                                |
|----------|----------------------------------------|
| `feat/`  | New feature                            |
| `fix/`   | Bug fix                                |
| `refactor/` | Code restructure, no behavior change |
| `docs/`  | Documentation only                     |
| `chore/` | Tooling, dependencies, CI              |

---

## Opening a Pull Request

1. **Target `develop`**, never push directly to `main`.
2. Fill in the pull request template — description, test plan, and checklist.
3. Keep PRs focused. One logical change per PR makes review faster.
4. Ensure `npm run lint` passes before opening the PR.

---

## Commit Messages

Use the imperative mood, present tense:

```
feat: add crossfade setting to player
fix: prevent mini player flickering on Android
docs: update installation steps in README
```

---

## Code Style

- **TypeScript** everywhere — no `any` unless unavoidable and justified.
- All **user-facing strings** must go through `src/i18n/fr.ts`. No hardcoded French (or any language) outside that file.
- **No comments** unless the *why* is genuinely non-obvious. The code should be self-documenting.
- Run `npm run lint` before committing.

---

## Reporting Issues

Use the GitHub issue templates:

- **Bug report** — steps to reproduce, expected vs actual behaviour, device/OS info.
- **Feature request** — problem statement, proposed solution, alternatives considered.

---

## License

By contributing, you agree that your contributions will be licensed under the same [CC BY-NC 4.0](LICENSE) license as the rest of the project.
