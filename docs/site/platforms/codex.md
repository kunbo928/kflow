# Codex

Codex is kflow's **Default Platform**. When you run `kflow init`, the project
is set up for Codex automatically.

## What gets installed

- `AGENTS.md` listing installed platforms
- `.kflow/` directory structure with all skills, reference docs, and tools
- **Runtime skills** in `.agents/skills/` — the shared universal Runtime
  Skill Directory for Codex, Cursor, and OpenCode
- Platform-specific integration files from `platforms/codex/`
- `.kflow/meta.json` recording the installed platform and version

## Runtime skills

Codex discovers kflow skills from **`.agents/skills/`** — the shared
universal Runtime Skill Directory. This directory is shared across Codex,
Cursor, and OpenCode. Installing multiple universal platforms writes one
shared copy, not duplicate directories.

`kflow sync` refreshes `.agents/skills/` from the installed package,
removing stale kflow-owned files while preserving any non-kflow skills
you've added.

## Getting started

```bash
npx kflow@latest init
```

Then load the project in Codex — `/k-flow` is ready to use.
