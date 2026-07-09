# Claude Code

Claude Code is a supported AI coding platform for kflow.

## Installation

```bash
kflow init --platform=claude
```

or add Claude to an existing project:

```bash
kflow init --platform=claude
```

This copies platform integration files from `platforms/claude/` into your
project, including:

- `CLAUDE.md` with Claude Code as the Default Platform
- **Runtime skills** installed into `.claude/skills/`, which Claude Code
  discovers natively
- Platform-specific integration files from `platforms/claude/`

After installation, **restart Claude Code** to pick up the integration
files.

## Runtime skills

`kflow init --platform=claude` installs packaged kflow skills into
**`.claude/skills/`** — Claude Code's native runtime skill directory. The
`CLAUDE.md` entry file points at `.claude/skills/` for full skill docs.

`kflow sync` refreshes `.claude/skills/` from the installed package,
removing stale kflow-owned files while preserving any non-kflow skills
you've added.

## Prerequisites

Run `kflow init` first to set up the project's `.kflow/` directory and core
assets.
