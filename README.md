<div align="center">

# kflow

**Make AI coding follow an engineering feedback loop—not merely produce plausible code.**

English · [简体中文](README-zh.md)

![status](https://img.shields.io/badge/status-beta-F59E0B?style=flat-square)
![skills](https://img.shields.io/badge/skills-8-2F7A5E?style=flat-square)

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

`init` installs eight Skills under `.agents/skills/` and connects detected Agent platforms. The registry matches K Teach and supports 35 tools, including Codex, Claude Code, Cursor, OpenCode, Gemini CLI, GitHub Copilot, Windsurf, and WorkBuddy.

```bash
kflow init --tools codex,claude
kflow init --tools all
```

Use `--copy` where symlinks are unavailable and `--force` to replace an existing integration.

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

Ordinary tasks create no cursor. `.kflow/cursors/` is used only for cross-session recovery, handoff, Roadmap execution, or explicit retention requests.

## The eight Skills

| Skill | Purpose |
|---|---|
| `k-flow` | common entry point and workflow routing |
| `k-onboard` | understand an existing project's code, tests, docs, and conventions |
| `k-feat` | add or change user-observable behavior |
| `k-issue` | reproduce, diagnose, and—when authorized—fix a defect |
| `k-refactor` | improve internal structure while preserving behavior |
| `k-roadmap` | coordinate multi-deliverable goals, dependencies, and acceptance |
| `k-review` | perform a read-only review of a frozen target |
| `k-knowledge` | manage attention, lessons, and durable knowledge ownership |

Each Skill is independently usable and follows the open Agent Skills directory format. Skills own judgment and engineering method; the CLI owns deterministic installation, checks, recovery, and document queries.

## Useful CLI commands

```bash
kflow doctor
kflow status
kflow cursor create k-feat export-csv --summary "Export CSV"
kflow cursor show export-csv --json
kflow cursor validate .kflow/cursors/export-csv.md
kflow document search --dir docs --query "cache"
kflow document validate --file docs/adr/001.md --require status
```

## What it adds to a project

```text
.agents/skills/       # canonical copies of the eight Skills
.kflow/
├── attention.md      # small set of facts needed for nearly every task
├── cursors/          # optional recovery cursors, deleted when complete
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
