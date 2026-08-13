<div align="center">

# kflow

**Make AI coding follow an engineering feedback loop—not merely produce plausible code.**

English · [简体中文](README-zh.md)

![status](https://img.shields.io/badge/status-beta-F59E0B?style=flat-square)
![skills](https://img.shields.io/badge/skills-12-2F7A5E?style=flat-square)

</div>

kflow is an engineering workflow for AI coding agents. It routes feature work, bug fixes, refactors, roadmaps, and reviews to focused Skills, then requires repeatable evidence that the requested outcome actually works.

You keep working in the project's existing code, tests, and documentation. kflow does not replace project management, create a parallel requirements system, or force ordinary tasks through workflow paperwork.

## What it helps you do

| Your task | How kflow approaches it | Completion evidence |
|---|---|---|
| Add or change behavior | define the target behavior, then implement the smallest complete change | target behavior `red → green` |
| Fix a bug | reproduce the same user-visible symptom before diagnosis and repair | symptom `red → green` |
| Refactor code | establish a behavioral baseline before changing structure | baseline `green → green` |
| Deliver a larger goal | manage dependencies, decisions, and independently verifiable items | item evidence + integrated acceptance |
| Review code | freeze the review target and report severity-ranked findings | localized, actionable findings |

Low-risk, well-defined work stays direct. Checkpoints and recovery records appear only when the actual risk, duration, or number of deliverables calls for them.

## Install

Node.js 20 or newer is required. Install the CLI globally, then initialize your project:

```bash
npm install -g @kunbo0928/k-flow@latest
cd your-project
kflow init
```

`init` installs twelve Skills under `.agents/skills/`, creates the progressive Project Map and Works skeleton, and connects detected Agent platforms.

```bash
kflow init --tools codex,claude
kflow init --tools all
```

Interactive `init` opens a searchable platform selector and preselects detected Agents. Use `--yes` (or `-y`) to skip selection and install to every detected Agent. In non-interactive environments, pass `--tools` when no Agent can be detected. Use `--copy` where symlinks are unavailable and `--force` to replace an existing integration.

## Use it

After initialization, describe the work naturally in your Agent. `k-flow` is the common entry point: it distinguishes execution, discussion, advice, and orientation, then routes engineering work to the right Skill.

```text
Use kflow to add CSV export to the orders table.

Use kflow to investigate why users sometimes return to the login page. Diagnose only.

Use kflow to refactor this cache without changing behavior.

Use kflow to plan and deliver the payment-module migration.

Use kflow to review this PR. Report findings without editing code.
```

```text
Your goal
  ↓
k-flow identifies task type and authorization boundary
  ↓
k-feat / k-issue / k-refactor / k-roadmap / k-review
  ↓
inspect real code and project conventions
  ↓
establish signal → make change → verify with the same signal
  ↓
deliver code, evidence, remaining risk, and durable knowledge
```

Each engineering task owns one `.kflow/works/{type}-{slug}/`: `spec.md` keeps the stable contract and `work.md` keeps active state. The user decides whether completed `work.md` remains.

## The twelve Skills

| Skill | Purpose |
|---|---|
| `k-flow` | common entry point and workflow routing |
| `k-onboard` | understand an existing project's code, tests, docs, and conventions |
| `k-feat` | add or change user-observable behavior |
| `k-issue` | reproduce, diagnose, and—when authorized—fix a defect |
| `k-refactor` | improve internal structure while preserving behavior |
| `k-roadmap` | coordinate multi-deliverable goals, dependencies, and acceptance |
| `k-research` | investigate primary evidence without implementation authority |
| `k-prototype` | use a disposable artifact to answer one decision |
| `k-architecture` | audit and design module architecture without implementation |
| `k-reconcile` | reconcile Project Map against code and canonical owners |
| `k-review` | perform a read-only review of a frozen target |
| `k-knowledge` | manage attention, lessons, and durable knowledge ownership |

Each Skill is independently usable and follows the open Agent Skills directory format. Skills own judgment and engineering method; the CLI owns deterministic installation, checks, recovery, and document queries.

## Useful CLI commands

```bash
kflow doctor
kflow status
kflow work create feat export-csv --summary "Export CSV" --skill k-feat
kflow work show feat-export-csv --skill k-feat --json
kflow work validate feat-export-csv --skill k-feat
kflow map validate --skill k-onboard
kflow document search --dir docs --query "cache" --skill k-roadmap
kflow document validate --file docs/adr/001.md --require status --skill k-roadmap
```

Skill calls must include `--skill`; the CLI uses it to validate invocation ownership and does not generate an invocation log.

## What it adds to a project

```text
.agents/skills/       # canonical copies of the twelve Skills
.kflow/
├── project-map/      # progressively disclosed project navigation
├── works/            # unified roadmap, task, and exploration Works
├── attention.md      # small set of facts needed for nearly every task
└── lessons/          # lessons not yet promoted to a stronger owner
```

Stable facts continue to live in project-owned code, tests, README files, product documents, ADRs, or architecture docs. Legacy `.kflow` data is never deleted or bulk-migrated automatically.

## Develop kflow

```bash
git clone https://github.com/kunbo928/kflow.git
cd kflow
npm install
npm run check
npm pack --dry-run
```

CLI sources live in `packages/cli/`; Skills live in `skills/`.
