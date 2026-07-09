# kflow sync

Refresh kflow-owned assets in your project.

## Usage

```
kflow sync
```

## What it does

`kflow sync` reads the installed platforms from `.kflow/meta.json` and
refreshes **every required Runtime Skill Directory**:

- **Claude Code installed** → refreshes `.claude/skills/`
- **Any universal Platform installed** (Codex / Cursor / OpenCode) →
  refreshes `.agents/skills/`
- **Both Claude and universal** → refreshes both directories

Shared Runtime Skill Directories are refreshed once — installing multiple
universal platforms does not produce duplicate sync passes.

Stale kflow-owned skill files are removed from managed Runtime Skill
Directories. **Non-kflow skills are preserved** in those directories.

Templates and tools are also mirror-synced from the currently installed
package:

| Source | Destination |
|--------|-------------|
| `templates/` | `.kflow/reference/` |
| `tools/` | `.kflow/tools/` |

Mirror sync means files that no longer exist in the current package are
deleted from those destination directories. This handles skill additions,
updates, deletions, and renames during version upgrades.

`kflow sync` does not touch user-owned project knowledge such as
`.kflow/features/`, `.kflow/issues/`, `.kflow/architecture/`,
`.kflow/compound/`, or `.kflow/attention.md`.

Run this after upgrading the kflow npm package to reconcile updated skills,
templates, and tools across all installed platforms.
