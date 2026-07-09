# Concepts

## Runtime Skill Directory

A project-local directory where an AI coding platform discovers installed
skills. kflow maps each platform to its runtime directory:

- **Claude Code** → `.claude/skills/`
- **Codex / Cursor / OpenCode** → `.agents/skills/` (shared universal directory)

`kflow init` installs packaged skills into each selected platform's Runtime
Skill Directory. `kflow sync` refreshes them from the installed package,
removing stale kflow-owned files while preserving non-kflow skills.

## Skills Directory

kflow ships a flat directory of skills under `skills/`. Each skill is a
directory containing:

- `SKILL.md` — the skill definition in AgentSkills.io format
- Any supporting files the skill references

The Skills Directory is the **source of truth**. When you run `kflow sync`,
the CLI copies it into each installed platform's Runtime Skill Directory
so your Agent Runtime can read them.

## Project Templates

Platform-neutral Markdown templates live under `templates/`. During
onboarding, these are copied into `.kflow/reference/`. They include:

- Architecture document templates
- Attention checklist templates
- Shared reference documents that skills read at runtime

## Platform Integration Templates

Each supported platform has a directory under `platforms/` that contains
**Platform Integration Templates** — files copied into your project root
by `kflow init` (or `kflow init --platform=<name>` to add a platform to
an existing project).

## Native Plugin Package

Platform-specific plugin package directories such as `.claude-plugin`,
`.codex-plugin`, `.cursor-plugin`, `.opencode`, and `.pi/extensions` are
**out of scope** for the kflow lifecycle feature. kflow does not create,
manage, or interact with these directories during init, sync, upgrade, or
uninstall.

## KFlow Brand Mark

A kflow-specific textual identity shown by the Workflow CLI during
`kflow init`. The deterministic path (`--platform=…`) displays a compact
one-line mark; the interactive path (no flags) displays a full mark
before the platform picker. The brand mark is **CLI output only** — it is
never written into `AGENTS.md`, `CLAUDE.md`, `.kflow/`, or any Runtime
Skill Directory.

## Project CLI Dependency

kflow is installed as a `devDependency` in your target project. This ensures
reproducible CLI behavior and allows skill workflows to invoke kflow commands
without a global install.

## Upgrade & Sync

See the [Upgrade & Sync](/upgrade/) guide for details on keeping your kflow
assets current.
