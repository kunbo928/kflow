# kflow doctor

Check kflow installation health.

## Usage

```
kflow doctor
```

## Checks performed

1. **`.kflow/` structure** — verifies `.kflow/reference/` and `.kflow/tools/`
   exist
2. **Default Platform** — checks that `AGENTS.md` declares Codex as the
   default platform
3. **CLI dependency** — checks that `kflow` is listed in `devDependencies`

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | All checks pass |
| 1 | One or more checks failed |
