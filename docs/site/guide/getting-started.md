# Getting Started

## Quick Start

Onboard your project with kflow:

```bash
npx kflow@latest init
```

kflow shows a **KFlow Brand Mark** in the terminal, then creates a `.kflow/`
directory with reference docs and tools. It installs packaged skills into
each selected platform's Runtime Skill Directory (`.agents/skills/` for
Codex/Cursor/OpenCode; `.claude/skills/` for Claude Code) and writes
platform entry files (`AGENTS.md` / `CLAUDE.md`).

Run `kflow sync` to refresh skills in all installed-platform Runtime Skill
Directories from the current package.

`/k-flow` is the **Skill Workflow entrypoint** inside your Agent Runtime — start
every interaction there. The agent will route you to the right sub-skill based
on your task.

## Next steps

- [CLI Reference](/cli/init) — learn the available commands
- [Workflows](/workflows/k-flow) — understand the skill workflow system
- [Platform Guides](/platforms/codex) — set up your AI coding tool
