# KFlow Glossary

Core domain terms used across the KFlow codebase. Each entry is a single
sentence of definition followed by where it lives in the code.

## Core

- **KFlow** — AI coding workflow skill pack for serious engineering, shipping
  as an npm package (`kflow` in `package.json`).
- **Workflow CLI** — Deterministic project tool that onboards projects, syncs
  assets, validates documents, and discovers skills (`src/cli.ts`).
- **Project Document** — A Markdown document with YAML frontmatter or a YAML-only
  document discovered and parsed into shared format facts for Workflow CLI
  policy (`src/project-document/index.ts`).
- **Skill Workflow** (`k-flow`) — Workflow router inside the Agent Runtime
  that dispatches user intent to sub-skills (`skills/k-flow/SKILL.md`).
- **KFlow Brand Mark** — kflow-specific textual identity shown by the Workflow
  CLI during human-facing onboarding (`kflow init`). CLI output only — never
  written into project files.

## Platform

- **Platform** — An AI agent runtime integration target: `codex`, `cursor`,
  `claude`, or `opencode` (`src/project-onboarding/lifecycle.ts`,
  `PLATFORM_REGISTRY`).
- **Platform Integration Template** — Package-bundled integration files under
  `platforms/<name>/` that are copied into the project root on init.
- **Native Plugin Package** — Platform-specific plugin package directory such
  as `.claude-plugin`, `.codex-plugin`, or `.cursor-plugin`. **Out of scope**
  for the kflow lifecycle — kflow does not create, manage, or interact with
  these directories.
- **Entry File** — Platform-specific top-level instruction file:
  `AGENTS.md` for codex/cursor/opencode, `CLAUDE.md` for claude
  (`src/project-onboarding/lifecycle.ts`, `PLATFORM_REGISTRY`).
- **Interactive Picker** — Terminal multi-select checkbox prompt (via
  `@inquirer/prompts`) for selecting platforms during `init` and `uninstall`.

## Skill Assets

- **Skill Asset** — A Markdown playbook in `skills/<name>/SKILL.md` defining
  agent behavior for a specific workflow domain.
- **Source Skill Asset** — Same as Skill Asset; the canonical copy shipped
  inside the npm package under `skills/`.
- **Runtime Skill Directory** — Project-local directory where an agent platform
  discovers installed skills. Maps to `.agents/skills/` for Codex/Cursor/OpenCode
  (shared universal) and `.claude/skills/` for Claude Code.

## Project State

- **`.kflow/`** — Project-local directory created by `kflow init` containing
  aggregation dirs (`requirements/`, `features/`, `issues/`, etc.),
  `architecture/`, `attention.md`, `reference/`, `tools/`, and `meta.json`.
- **`meta.json`** — Project state file at `.kflow/meta.json` recording
  installed platforms with timestamps (`{"platforms": [{"name":"codex",
  "installedAt":"..."}], "version":"x.x.x"}`).
- **Aggregation Dirs** — Subdirectories under `.kflow/` for organizing
  project artifacts: `requirements`, `roadmap`, `features`, `issues`,
  `refactors`, `brainstorms`, `compound` (`src/commands/init.ts:18-26`).
- **`attention.md`** — Short-reminder checklist read by execution skills
  before acting (`src/commands/init.ts:44-67`).

## Commands

- **`kflow init`** — Onboard a project: show brand mark, create `.kflow/`
  structure, install packaged skills into each selected platform's Runtime
  Skill Directory (deduplicated across shared dirs), write platform entry
  files, record state in `.kflow/meta.json`, save as devDependency
  (`src/commands/init.ts`).
- **`kflow uninstall`** — Remove platform integrations (interactive picker
  or `--platform <list> --apply`). Respects shared `.agents/skills/`
  ownership: uninstalling one universal Platform preserves the Runtime Skill
  Directory when another universal Platform remains installed. Uninstalling
  the last universal Platform removes kflow-owned skills while preserving
  non-kflow skills. Full uninstall removes kflow-owned skills from all
  managed Runtime Skill Directories. Preserves `.kflow/` and kflow CLI
  package dependency for platform uninstall (`src/commands/uninstall.ts`).
- **`kflow sync`** — Reads installed Platforms from `.kflow/meta.json` and
  refreshes every required Runtime Skill Directory (`.claude/skills/` for
  Claude, `.agents/skills/` for universal). Shared directories are
  refreshed once. Stale kflow-owned skill files are removed; non-kflow
  skills are preserved (`src/commands/sync.ts`).
- **`kflow doctor`** — Check kflow installation health (`src/commands/doctor.ts`).
- **`kflow upgrade`** — Plan or apply a kflow package version upgrade
  (`src/commands/upgrade.ts`).
- **`kflow search`** — Search YAML-frontmatter `.md` files (`src/commands/search.ts`).
- **`kflow validate`** — Validate YAML frontmatter in `.md` or `.yaml` files
  (`src/commands/validate.ts`).

## Architecture Decisions

- **ADR** — Architecture Decision Record in `docs/adr/`, numbered
  sequentially. Captures why a hard-to-reverse decision was made.
- **Deferred Dependency** — A runtime package category that requires a
  dedicated ADR before inclusion (`docs/site/upgrade/dependencies.md`).
- **Marker** — `"Generated by kflow"` string used to identify kflow-owned
  files during lifecycle inspection and removal
  (`src/project-onboarding/lifecycle.ts`).

## Template

- **ARCHITECTURE.md** — Skeleton document placed in `.kflow/architecture/`
  on init, meant to be filled in by the team
  (`src/commands/init.ts:28-42`).
- **Project Templates** — Packaged template files under `templates/`
  copied into `.kflow/reference/` on init.
