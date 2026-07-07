# Getting Started

## Quick Start

Onboard your project with kflow:

```bash
npx kflow@latest init
```

kflow creates a `.kflow/` directory with reference docs and tools. It
also writes an `AGENTS.md` file so your Agent Runtime knows how to route
workflows. Run `kflow sync` to populate `.agents/skills/` from the installed
package.

`/k-flow` is the **Skill Workflow entrypoint** inside your Agent Runtime — start
every interaction there. The agent will route you to the right sub-skill based
on your task.

## Next steps

- [CLI Reference](/cli/init) — learn the available commands
- [Workflows](/workflows/k-flow) — understand the skill workflow system
- [Platform Guides](/platforms/codex) — set up your AI coding tool
