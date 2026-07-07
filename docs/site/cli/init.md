# kflow init

Onboard a project with kflow assets.

## Usage

```
kflow init [--platform <name>] [--no-save]
```

## What it does

1. Creates `.kflow/` with aggregation directories and an architecture template
2. Copies `templates/` → `.kflow/reference/`
3. Copies `tools/` → `.kflow/tools/`
4. Writes `AGENTS.md` with the Default Platform marker (Codex)
5. Saves `kflow` as a devDependency in `package.json` (unless `--no-save`)

## Options

| Option | Description |
|--------|-------------|
| `--platform <name>` | Target AI coding platform (default: `codex`) |
| `--no-save` | Skip adding kflow to `devDependencies` |
