# kflow sync

Refresh kflow-owned assets in your project.

## Usage

```
kflow sync
```

## What it does

Mirrors kflow-owned asset directories from the currently installed npm package
into your project:

| Source | Destination |
|--------|-------------|
| `skills/` | `.agents/skills/` |
| `templates/` | `.kflow/reference/` |
| `tools/` | `.kflow/tools/` |

Mirror sync means files that no longer exist in the current package are deleted
from those destination directories. This handles skill additions, updates,
deletions, and renames during version upgrades.

`kflow sync` does not touch user-owned project knowledge such as
`.kflow/features/`, `.kflow/issues/`, `.kflow/architecture/`,
`.kflow/compound/`, or `.kflow/attention.md`.

Run this after upgrading the kflow npm package to reconcile updated skills,
templates, tools, and Codex runtime skills.
