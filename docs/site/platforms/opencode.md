# OpenCode

OpenCode is a supported AI coding platform for kflow.

## Installation

```bash
kflow init --platform=opencode
```

or add OpenCode to an existing project:

```bash
kflow init --platform=opencode
```

This copies platform integration files from `platforms/opencode/` into your
project. After installation, **reload OpenCode** to pick up the integration
files.

## What gets installed

- `AGENTS.md` listing installed platforms
- `.kflow/` directory structure with all skills, reference docs, and tools
- **Runtime skills** in `.agents/skills/` — the shared universal Runtime
  Skill Directory for Codex, Cursor, and OpenCode
- Platform-specific integration files from `platforms/opencode/`
- `.kflow/meta.json` recording the installed platform and version

## Runtime skills

OpenCode discovers kflow skills from **`.agents/skills/`** — the shared
universal Runtime Skill Directory. This directory is shared across Codex,
Cursor, and OpenCode. Installing multiple universal platforms writes one
shared copy, not duplicate directories.

`kflow sync` refreshes `.agents/skills/` from the installed package,
removing stale kflow-owned files while preserving any non-kflow skills
you've added.

## Prerequisites

Run `kflow init` first to set up the project's `.kflow/` directory and core
assets.
