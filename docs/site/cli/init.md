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
4. Installs packaged skills into each selected platform's **Runtime Skill Directory**:
   - **Claude Code** → `.claude/skills/`
   - **Codex / Cursor / OpenCode** → `.agents/skills/` (shared universal directory)
5. Shared Runtime Skill Directories are handled once per init run — installing
   multiple universal platforms writes one shared copy, not divergent duplicates.
6. Writes platform entry files (`AGENTS.md` for universal platforms,
   `CLAUDE.md` for Claude Code)
7. Records selected platforms and version in `.kflow/meta.json`
8. Saves `kflow` as a devDependency in `package.json` (unless `--no-save`)

### Brand mark

`kflow init` shows a **KFlow Brand Mark** in CLI output:

- Deterministic mode (`--platform=…`): compact one-line mark
- Interactive mode (no flags): full mark before the platform picker

The brand mark is **CLI output only** — it is never written into
`AGENTS.md`, `CLAUDE.md`, `.kflow/`, or any Runtime Skill Directory.

## Options

| Option | Description |
|--------|-------------|
| `--platform <name>` | Comma-separated AI coding platforms: `codex`, `cursor`, `claude`, `opencode` |
| `--no-save` | Skip adding kflow to `devDependencies` |
