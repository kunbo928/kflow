<div align="center">

# kflow

**Make AI coding follow an engineering feedback loop—not merely produce plausible code.**

English · [简体中文](README-zh.md)

![status](https://img.shields.io/badge/status-beta-F59E0B?style=flat-square)
![skills](https://img.shields.io/badge/skills-14-2F7A5E?style=flat-square)

</div>

kflow is an engineering workflow for AI coding agents. It routes work to focused Skills, then requires repeatable evidence that the requested outcome actually works.

You keep working in the project's existing code, tests, and documentation. kflow does not replace project management, create a parallel requirements system, or force ordinary tasks through workflow paperwork.

## What it helps you do

| Your task | How kflow approaches it | Completion evidence |
|---|---|---|
| Add or change behavior | grill until Spec Clear, then implement the smallest complete change | target behavior `red → green` |
| Fix a bug | reproduce the same user-visible symptom; diagnosis is not repair authority | symptom `red → green` |
| Refactor code | establish a behavioral baseline before changing structure | baseline `green → green` |
| Deliver a larger goal | manage dependencies, decisions, and independently verifiable items | item evidence + integrated acceptance |
| Review code | freeze git `base`/`head` and report severity-ranked findings | independent `review_passed` or owner `risk_accepted` |

Low-risk, well-defined work stays direct. Checkpoints and recovery records appear only when the actual risk, duration, or number of deliverables calls for them.

## Install

Node.js 20 or newer is required. Install the CLI globally, then initialize your project:

```bash
npm install -g @kunbo0928/k-flow@latest
cd your-project
kflow init
```

`init` installs fourteen Skills under `.agents/skills/`, creates the progressive Project Map and Works skeleton, and connects detected Agent platforms. It does not create `lessons/` or `attention.md`.

```bash
kflow init --tools codex,claude
kflow init --tools all
```

Interactive `init` opens a searchable platform selector and preselects detected Agents. Use `--yes` (or `-y`) to skip selection and install to every detected Agent. In non-interactive environments, pass `--tools` when no Agent can be detected. Use `--copy` where symlinks are unavailable and `--force` to replace an existing integration.

## Use it

After initialization, describe the work naturally in your Agent. `k-flow` is the common entry point: it reads the Project Map, then selects a Work type and the current step.

```text
Use kflow to add CSV export to the orders table.

Use kflow to investigate why users sometimes return to the login page. Diagnose only.

Use kflow to refactor this cache without changing behavior.

Use kflow to plan and deliver the payment-module migration.

Use kflow to review this PR. Report findings without editing product code.
```

```text
Your goal
  ↓
k-flow selects Work type and current step
  ↓
k-grilling until Spec Clear → k-implement (red → green) → k-review → k-knowledge
  ↓
inspect real code and project conventions
  ↓
deliver code, evidence, remaining risk, and durable context in AGENTS.md / project-map
```

Each bounded effort owns one `.kflow/works/{type}-{slug}/`: `spec.md` keeps the stable contract and `work.md` keeps active state. The user decides whether completed `work.md` remains.

## The fourteen Skills

| Skill | Purpose |
|---|---|
| `k-flow` | common entry: choose Work type and current step |
| `k-onboard` | build a verified Project Map and AGENTS contract |
| `k-feat` | add or change user-observable behavior |
| `k-issue` | reproduce, diagnose, and—when authorized—fix a defect |
| `k-refactor` | improve internal structure while preserving behavior |
| `k-roadmap` | coordinate multi-deliverable goals, dependencies, and acceptance |
| `k-research` | investigate primary evidence without implementation authority |
| `k-prototype` | use a disposable artifact to answer one decision |
| `k-reconcile` | reconcile Project Map against code and canonical owners |
| `k-implement` | TDD against an existing spec; does not create a Work type |
| `k-grilling` | question until Spec Clear; zero questions when already clear |
| `k-review` | independent two-axis review of a frozen `base`/`head` |
| `k-knowledge` | write durable facts back to AGENTS.md or project-map |
| `k-author` | how to write agent-facing AGENTS.md, maps, and Skills |

Each Skill is independently usable and follows the open Agent Skills directory format. Skills own judgment and engineering method; the CLI owns deterministic installation, shape checks, recovery, and document queries.

## Useful CLI commands

```bash
kflow doctor
kflow status
kflow work create feat export-csv --summary "Export CSV"
kflow work show feat-export-csv --json
kflow work validate feat-export-csv
kflow map validate
kflow document search --dir docs --query "cache"
kflow document validate --file docs/adr/001.md --require status
```

The CLI enforces shape, non-empty contract sections, and that map pointers exist. It does not run tests, score grilling, or judge whether the reviewer was the implementer.

## What it adds to a project

```text
.agents/skills/       # canonical copies of the fourteen Skills
.kflow/
├── project-map/      # progressively disclosed project navigation
└── works/            # unified roadmap, task, and exploration Works
```

AI-facing entry points are root `AGENTS.md` and project-map. Stable facts continue to live in project-owned code, tests, README files, product documents, or ADRs. Legacy `.kflow` data is never deleted or bulk-migrated automatically.

## Develop kflow

```bash
git clone https://github.com/kunbo928/kflow.git
cd kflow
npm install
npm run check
npm pack --dry-run
```

CLI sources live in `packages/cli/`; Skills live in `skills/`.
