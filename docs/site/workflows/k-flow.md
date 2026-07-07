# k-flow

`k-flow` is the **Skill Workflow entrypoint** inside the Agent Runtime. After
you initialize your project with `kflow init`, invoke `/k-flow` to start any
workflow.

## What it does

`k-flow` is a routing skill. It does not implement workflow logic directly.
Instead, it inspects your request and routes you to the correct sub-skill from
the Skills Directory.

## Available workflows

The Skills Directory includes 26 skills covering:

- **Requirements & Architecture** — `k-req`, `k-arch`
- **Features** — `k-feat`, `k-feat-design`, `k-feat-impl`, `k-feat-accept`
- **Issues** — `k-issue`, `k-issue-report`, `k-issue-analyze`, `k-issue-fix`
- **Refactoring** — `k-refactor`, `k-refactor-ff`
- **Auditing** — `k-audit`
- **Knowledge** — `k-learn`, `k-trick`, `k-decide`
- **Exploration** — `k-explore`, `k-guide`, `k-libdoc`

## Relationship to the CLI

The Workflow CLI (`kflow`) sets up your project. `k-flow` is what you use
*inside* the Agent Runtime to do the work. They are complementary tools, not
replacements for each other.
