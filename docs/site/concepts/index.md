# Concepts

## Skills Directory

kflow ships a flat directory of skills under `skills/`. Each skill is a
directory containing:

- `SKILL.md` — the skill definition in AgentSkills.io format
- Any supporting files the skill references

The Skills Directory is the **source of truth**. When you run `kflow sync`, the
CLI copies it into your project's `.agents/skills/` so your Agent Runtime can
read them.

## Project Templates

Platform-neutral Markdown templates live under `templates/`. During onboarding,
these are copied into `.kflow/reference/`. They include:

- Architecture document templates
- Attention checklist templates
- Shared reference documents that skills read at runtime

## Platform Plugin Directories

Each supported platform has a directory under `platforms/` that contains
integration assets. The `kflow install <platform>` command copies these into
your project.

## Project CLI Dependency

kflow is installed as a `devDependency` in your target project. This ensures
reproducible CLI behavior and allows skill workflows to invoke kflow commands
without a global install.

## Upgrade & Sync

See the [Upgrade & Sync](/upgrade/) guide for details on keeping your kflow
assets current.
